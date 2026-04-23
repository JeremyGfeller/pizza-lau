import { NextRequest } from "next/server";
import { requireApiUser } from "@/lib/api-auth";
import { jsonOk } from "@/lib/http";
import { getOrdersForUser } from "@/lib/services/order-service";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const auth = await requireApiUser(request);
  if (auth.error) {
    return auth.error;
  }

  const orders = await getOrdersForUser(auth.user.id);
  return jsonOk({ orders });
}
