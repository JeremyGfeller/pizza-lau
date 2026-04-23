import Stripe from "stripe";
import { PaymentStatus } from "@prisma/client";
import { Prisma } from "@prisma/client";
import { env } from "@/lib/env";
import { jsonError, jsonOk } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { markOrderPaid } from "@/lib/services/order-service";
import { stripe } from "@/lib/stripe";

export const runtime = "nodejs";

export async function POST(request: Request) {
  if (!stripe || !env.stripeWebhookSecret) {
    return jsonError("Stripe webhook non configuré", 500);
  }

  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return jsonError("Missing stripe-signature", 400);
  }

  const payload = await request.text();
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(payload, signature, env.stripeWebhookSecret);
  } catch (error) {
    return jsonError(
      `Signature webhook invalide: ${error instanceof Error ? error.message : "unknown"}`,
      400,
    );
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    if (session.id) {
      await markOrderPaid(session.id, session.payment_intent?.toString(), event);
    }
  }

  if (event.type === "checkout.session.async_payment_failed") {
    const session = event.data.object as Stripe.Checkout.Session;
    if (session.id) {
      await prisma.order.updateMany({
        where: { stripeSessionId: session.id },
        data: {
          paymentStatus: PaymentStatus.FAILED,
        },
      });
      await prisma.payment.updateMany({
        where: { stripeSessionId: session.id },
        data: {
          status: PaymentStatus.FAILED,
          rawProviderPayload: JSON.parse(JSON.stringify(event)) as Prisma.InputJsonValue,
        },
      });
    }
  }

  return jsonOk({ received: true });
}
