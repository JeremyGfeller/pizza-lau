import { NextRequest } from "next/server";
import { requireApiUser } from "@/lib/api-auth";
import { jsonError, jsonOk } from "@/lib/http";
import { getOrderByIdForUser } from "@/lib/services/order-service";

export const runtime = "nodejs";

export async function GET(request: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const auth = await requireApiUser(request);
  if (auth.error) {
    return auth.error;
  }

  const { id } = await ctx.params;
  const order = await getOrderByIdForUser(id, auth.user.id, auth.user.role);
  if (!order) {
    return jsonError("Commande introuvable", 404);
  }
  return jsonOk({ order });
}
