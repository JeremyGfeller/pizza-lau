import { type z } from "zod";
import { prisma } from "@/lib/prisma";
import { fromDecimal, roundChf } from "@/lib/money";
import { cartItemSchema } from "@/lib/validators";

const cartInclude = {
  items: {
    include: {
      pizza: true,
      sizeOption: true,
      extras: {
        include: {
          extraOption: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc" as const,
    },
  },
};

export async function getOrCreateCart(userId: string) {
  const existing = await prisma.cart.findUnique({
    where: { userId },
    include: cartInclude,
  });
  if (existing) {
    return existing;
  }
  return prisma.cart.create({
    data: { userId },
    include: cartInclude,
  });
}

export async function getCart(userId: string) {
  return getOrCreateCart(userId);
}

export async function addCartItem(
  userId: string,
  input: z.infer<typeof cartItemSchema>,
) {
  const parsed = cartItemSchema.parse(input);
  const cart = await getOrCreateCart(userId);

  const pizza = await prisma.pizza.findUnique({
    where: { id: parsed.pizzaId },
    include: {
      sizes: true,
      allowedExtras: {
        include: { extra: true },
      },
    },
  });

  if (!pizza || !pizza.isAvailable) {
    throw new Error("Pizza indisponible");
  }

  const size = parsed.sizeOptionId
    ? pizza.sizes.find((item) => item.id === parsed.sizeOptionId && item.isActive)
    : null;

  if (parsed.sizeOptionId && !size) {
    throw new Error("Taille invalide");
  }

  const allowedExtraIds = new Set(pizza.allowedExtras.map((item) => item.extraId));
  const extrasPayload = parsed.extras ?? [];
  for (const extra of extrasPayload) {
    if (!allowedExtraIds.has(extra.extraOptionId)) {
      throw new Error("Supplément invalide");
    }
  }

  const basePrice = roundChf(fromDecimal(pizza.basePriceChf) + fromDecimal(size?.priceDeltaChf));

  const resolvedExtras = pizza.allowedExtras
    .map((item) => {
      const picked = extrasPayload.find((extra) => extra.extraOptionId === item.extraId);
      if (!picked) {
        return null;
      }
      return {
        extraOptionId: item.extraId,
        quantity: picked.quantity,
        unitPriceChf: item.extra.priceChf,
      };
    })
    .filter((item): item is NonNullable<typeof item> => item !== null);

  await prisma.cartItem.create({
    data: {
      cartId: cart.id,
      pizzaId: pizza.id,
      sizeOptionId: size?.id,
      quantity: parsed.quantity,
      unitPriceChf: basePrice,
      notes: parsed.notes?.trim() || null,
      extras: {
        create: resolvedExtras.map((extra) => ({
          extraOptionId: extra.extraOptionId,
          quantity: extra.quantity,
          unitPriceChf: extra.unitPriceChf,
        })),
      },
    },
  });

  return getOrCreateCart(userId);
}

export async function updateCartItemQuantity(userId: string, cartItemId: string, quantity: number) {
  const cart = await getOrCreateCart(userId);
  await prisma.cartItem.updateMany({
    where: {
      id: cartItemId,
      cartId: cart.id,
    },
    data: { quantity },
  });
  return getOrCreateCart(userId);
}

export async function removeCartItem(userId: string, cartItemId: string) {
  const cart = await getOrCreateCart(userId);
  await prisma.cartItem.deleteMany({
    where: {
      id: cartItemId,
      cartId: cart.id,
    },
  });
  return getOrCreateCart(userId);
}

export async function clearCart(userId: string) {
  const cart = await getOrCreateCart(userId);
  await prisma.cartItem.deleteMany({
    where: {
      cartId: cart.id,
    },
  });
}

export function serializeCart(cart: Awaited<ReturnType<typeof getCart>>) {
  const items = cart.items.map((item) => {
    const extrasTotalPerUnit = item.extras.reduce(
      (sum, extra) => sum + fromDecimal(extra.unitPriceChf) * extra.quantity,
      0,
    );
    const unitTotal = roundChf(fromDecimal(item.unitPriceChf) + extrasTotalPerUnit);
    const lineTotal = roundChf(unitTotal * item.quantity);
    return {
      id: item.id,
      quantity: item.quantity,
      notes: item.notes,
      pizza: {
        id: item.pizza.id,
        slug: item.pizza.slug,
        name: item.pizza.name,
        imageUrl: item.pizza.imageUrl,
      },
      size: item.sizeOption
        ? {
            id: item.sizeOption.id,
            name: item.sizeOption.name,
          }
        : null,
      extras: item.extras.map((extra) => ({
        id: extra.id,
        name: extra.extraOption.name,
        quantity: extra.quantity,
        unitPriceChf: fromDecimal(extra.unitPriceChf),
      })),
      unitPriceChf: unitTotal,
      lineTotalChf: lineTotal,
    };
  });

  const subtotal = roundChf(items.reduce((sum, item) => sum + item.lineTotalChf, 0));

  return {
    id: cart.id,
    items,
    itemCount: items.reduce((sum, item) => sum + item.quantity, 0),
    subtotalChf: subtotal,
  };
}
