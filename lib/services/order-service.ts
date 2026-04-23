import { OrderStatus, PaymentStatus, PickupMode, Prisma, UserRole } from "@prisma/client";
import { type z } from "zod";
import { env } from "@/lib/env";
import { fromDecimal, roundChf, toCents } from "@/lib/money";
import { canTransition } from "@/lib/order-status";
import { prisma } from "@/lib/prisma";
import { clearCart, getCart, serializeCart } from "@/lib/services/cart-service";
import { enqueuePrintJob } from "@/lib/services/print-service";
import { stripe } from "@/lib/stripe";
import { checkoutSchema } from "@/lib/validators";

type CheckoutInput = z.infer<typeof checkoutSchema>;

async function resolveDeliveryFee(input: CheckoutInput) {
  if (input.pickupMode !== PickupMode.DELIVERY || !input.deliveryAddress) {
    return { fee: 0, zoneId: null as string | null };
  }

  const zone = await prisma.deliveryZone.findFirst({
    where: {
      isActive: true,
      postalCodes: {
        has: input.deliveryAddress.postalCode,
      },
    },
  });

  if (!zone) {
    throw new Error("Adresse hors zone de livraison");
  }

  return {
    fee: fromDecimal(zone.deliveryFeeChf),
    zoneId: zone.id,
  };
}

export async function createCheckoutSessionFromCart(userId: string, payload: CheckoutInput) {
  const input = checkoutSchema.parse(payload);
  const cart = serializeCart(await getCart(userId));
  if (!cart.items.length) {
    throw new Error("Panier vide");
  }
  if (!stripe) {
    throw new Error("Stripe non configuré");
  }

  const delivery = await resolveDeliveryFee(input);
  const subtotal = cart.subtotalChf;
  const taxAmount = roundChf((subtotal + delivery.fee) * (env.taxRatePercent / 100));
  const total = roundChf(subtotal + delivery.fee + taxAmount);

  const createdOrder = await prisma.$transaction(async (tx) => {
    const order = await tx.order.create({
      data: {
        userId,
        status: OrderStatus.PENDING,
        pickupMode: input.pickupMode,
        paymentStatus: PaymentStatus.REQUIRES_PAYMENT,
        currency: "CHF",
        subtotalChf: subtotal,
        deliveryFeeChf: delivery.fee,
        taxRatePercent: env.taxRatePercent,
        taxAmountChf: taxAmount,
        totalChf: total,
        customerName: input.customerName,
        customerPhone: input.customerPhone || null,
        customerEmail: input.customerEmail || null,
        customerNotes: input.customerNotes?.trim() || null,
        deliveryStreet: input.deliveryAddress?.street ?? null,
        deliveryPostalCode: input.deliveryAddress?.postalCode ?? null,
        deliveryCity: input.deliveryAddress?.city ?? null,
        deliveryCanton: input.deliveryAddress?.canton ?? null,
        deliveryZoneId: delivery.zoneId,
        items: {
          create: cart.items.map((item) => ({
            pizzaId: item.pizza.id,
            pizzaNameSnapshot: item.pizza.name,
            sizeNameSnapshot: item.size?.name ?? null,
            quantity: item.quantity,
            unitPriceChf: item.unitPriceChf,
            lineTotalChf: item.lineTotalChf,
            notes: item.notes ?? null,
            extras: {
              create: item.extras.map((extra) => ({
                nameSnapshot: extra.name,
                quantity: extra.quantity,
                unitPriceChf: extra.unitPriceChf,
                lineTotalChf: roundChf(extra.quantity * extra.unitPriceChf),
              })),
            },
          })),
        },
        statusHistory: {
          create: {
            fromStatus: null,
            toStatus: OrderStatus.PENDING,
            note: "Commande créée",
          },
        },
        payment: {
          create: {
            amountChf: total,
            currency: "CHF",
            status: PaymentStatus.REQUIRES_PAYMENT,
          },
        },
      },
      include: {
        items: true,
      },
    });

    return order;
  });

  const stripeSession = await stripe.checkout.sessions.create({
    mode: "payment",
    payment_method_types: ["card", "twint"],
    locale: "fr",
    client_reference_id: createdOrder.id,
    metadata: {
      orderId: createdOrder.id,
      orderNumber: String(createdOrder.orderNumber),
    },
    success_url: `${env.appUrl}/paiement/succes?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${env.appUrl}/paiement/echec?orderId=${createdOrder.id}`,
    line_items: [
      ...createdOrder.items.map((item) => ({
        quantity: item.quantity,
        price_data: {
          currency: "chf",
          unit_amount: toCents(fromDecimal(item.unitPriceChf)),
          product_data: {
            name: item.pizzaNameSnapshot,
            description: item.sizeNameSnapshot ?? undefined,
          },
        },
      })),
      ...(delivery.fee > 0
        ? [
            {
              quantity: 1,
              price_data: {
                currency: "chf",
                unit_amount: toCents(delivery.fee),
                product_data: {
                  name: "Frais de livraison",
                },
              },
            },
          ]
        : []),
      ...(taxAmount > 0
        ? [
            {
              quantity: 1,
              price_data: {
                currency: "chf",
                unit_amount: toCents(taxAmount),
                product_data: {
                  name: `TVA (${env.taxRatePercent}%)`,
                },
              },
            },
          ]
        : []),
    ],
  });

  await prisma.order.update({
    where: { id: createdOrder.id },
    data: {
      stripeSessionId: stripeSession.id,
      payment: {
        update: {
          stripeSessionId: stripeSession.id,
        },
      },
    },
  });

  return {
    orderId: createdOrder.id,
    checkoutUrl: stripeSession.url,
  };
}

export async function markOrderPaid(stripeSessionId: string, paymentIntentId?: string | null, payload?: unknown) {
  const order = await prisma.order.findUnique({
    where: { stripeSessionId },
  });
  if (!order) {
    throw new Error(`Order not found for session ${stripeSessionId}`);
  }
  if (order.paymentStatus === PaymentStatus.SUCCEEDED) {
    return order;
  }

  const updated = await prisma.$transaction(async (tx) => {
    const nextOrder = await tx.order.update({
      where: { id: order.id },
      data: {
        paymentStatus: PaymentStatus.SUCCEEDED,
        status: OrderStatus.PAID,
        paidAt: new Date(),
        stripePaymentIntentId: paymentIntentId ?? undefined,
        statusHistory: {
          create: {
            fromStatus: order.status,
            toStatus: OrderStatus.PAID,
            note: "Paiement confirmé via Stripe",
          },
        },
      },
    });

    await tx.payment.updateMany({
      where: { orderId: order.id },
      data: {
        status: PaymentStatus.SUCCEEDED,
        stripePaymentIntentId: paymentIntentId ?? undefined,
        rawProviderPayload: payload as Prisma.InputJsonValue | undefined,
      },
    });

    return nextOrder;
  });

  await clearCart(updated.userId);
  return updated;
}

export async function updateOrderStatusByAdmin(args: {
  orderId: string;
  toStatus: OrderStatus;
  changedByUserId: string;
  note?: string;
}) {
  const order = await prisma.order.findUnique({
    where: { id: args.orderId },
    include: { user: true },
  });
  if (!order) {
    throw new Error("Commande introuvable");
  }

  if (!canTransition(order.status, args.toStatus)) {
    throw new Error(`Transition ${order.status} -> ${args.toStatus} interdite`);
  }

  const timestamps: Prisma.OrderUpdateInput = {};
  if (args.toStatus === OrderStatus.PREPARING) {
    timestamps.preparingAt = new Date();
  }
  if (args.toStatus === OrderStatus.READY) {
    timestamps.readyAt = new Date();
  }
  if (args.toStatus === OrderStatus.DELIVERED || args.toStatus === OrderStatus.PICKED_UP) {
    timestamps.deliveredAt = new Date();
  }
  if (args.toStatus === OrderStatus.CANCELLED) {
    timestamps.cancelledAt = new Date();
  }

  const updated = await prisma.order.update({
    where: { id: order.id },
    data: {
      status: args.toStatus,
      ...timestamps,
      statusHistory: {
        create: {
          fromStatus: order.status,
          toStatus: args.toStatus,
          changedByUserId: args.changedByUserId,
          note: args.note?.trim() || null,
        },
      },
    },
  });

  if (order.status === OrderStatus.PAID && args.toStatus === OrderStatus.PREPARING) {
    await enqueuePrintJob(order.id);
  }

  return updated;
}

export async function getOrdersForUser(userId: string) {
  return prisma.order.findMany({
    where: { userId },
    include: {
      items: {
        include: {
          extras: true,
        },
      },
      statusHistory: {
        orderBy: { createdAt: "asc" },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });
}

export async function getOrderByIdForUser(orderId: string, userId: string, role: UserRole) {
  return prisma.order.findFirst({
    where: role === UserRole.CUSTOMER ? { id: orderId, userId } : { id: orderId },
    include: {
      items: {
        include: {
          extras: true,
        },
      },
      statusHistory: {
        orderBy: { createdAt: "asc" },
      },
      printJobs: {
        orderBy: { createdAt: "desc" },
        take: 5,
      },
    },
  });
}
