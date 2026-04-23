import { NextRequest } from "next/server";
import { requireApiUser } from "@/lib/api-auth";
import { jsonError, jsonOk } from "@/lib/http";
import { createCheckoutSessionFromCart } from "@/lib/services/order-service";
import { checkoutSchema } from "@/lib/validators";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const auth = await requireApiUser(request);
  if (auth.error) {
    return auth.error;
  }

  const body = await request.json().catch(() => null);
  const parsed = checkoutSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError(parsed.error.issues[0]?.message ?? "Payload invalide", 422);
  }

  try {
    const result = await createCheckoutSessionFromCart(auth.user.id, parsed.data);
    return jsonOk(result, 201);
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "Checkout indisponible", 400);
  }
}
