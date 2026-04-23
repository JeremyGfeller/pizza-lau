import { NextRequest } from "next/server";
import { z } from "zod";
import { requireApiUser } from "@/lib/api-auth";
import { jsonError, jsonOk } from "@/lib/http";
import {
  addCartItem,
  getCart,
  removeCartItem,
  serializeCart,
  updateCartItemQuantity,
} from "@/lib/services/cart-service";
import { cartItemSchema, updateCartItemSchema } from "@/lib/validators";

export const runtime = "nodejs";

const deleteSchema = z.object({
  cartItemId: z.string().cuid(),
});

export async function GET(request: NextRequest) {
  const auth = await requireApiUser(request);
  if (auth.error) {
    return auth.error;
  }
  const cart = await getCart(auth.user.id);
  return jsonOk({ cart: serializeCart(cart) });
}

export async function POST(request: NextRequest) {
  const auth = await requireApiUser(request);
  if (auth.error) {
    return auth.error;
  }

  const body = await request.json().catch(() => null);
  const parsed = cartItemSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError(parsed.error.issues[0]?.message ?? "Payload invalide", 422);
  }
  try {
    const cart = await addCartItem(auth.user.id, parsed.data);
    return jsonOk({ cart: serializeCart(cart) }, 201);
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "Impossible d'ajouter au panier", 400);
  }
}

export async function PATCH(request: NextRequest) {
  const auth = await requireApiUser(request);
  if (auth.error) {
    return auth.error;
  }

  const body = await request.json().catch(() => null);
  const parsed = updateCartItemSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError(parsed.error.issues[0]?.message ?? "Payload invalide", 422);
  }
  const cart = await updateCartItemQuantity(auth.user.id, parsed.data.cartItemId, parsed.data.quantity);
  return jsonOk({ cart: serializeCart(cart) });
}

export async function DELETE(request: NextRequest) {
  const auth = await requireApiUser(request);
  if (auth.error) {
    return auth.error;
  }

  const body = await request.json().catch(() => null);
  const parsed = deleteSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError(parsed.error.issues[0]?.message ?? "Payload invalide", 422);
  }
  const cart = await removeCartItem(auth.user.id, parsed.data.cartItemId);
  return jsonOk({ cart: serializeCart(cart) });
}
