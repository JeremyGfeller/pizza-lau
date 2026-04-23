import { UserRole } from "@prisma/client";
import { NextRequest } from "next/server";
import { requireApiRole, requireApiUser } from "@/lib/api-auth";
import { jsonError, jsonOk } from "@/lib/http";
import { updateOrderStatusByAdmin } from "@/lib/services/order-service";
import { updateOrderStatusSchema } from "@/lib/validators";

export const runtime = "nodejs";

export async function PATCH(request: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const auth = await requireApiUser(request);
  if (auth.error) {
    return auth.error;
  }
  const roleError = requireApiRole(auth.user.role, [UserRole.ADMIN, UserRole.STAFF]);
  if (roleError) {
    return roleError;
  }

  const body = await request.json().catch(() => null);
  const parsed = updateOrderStatusSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError(parsed.error.issues[0]?.message ?? "Payload invalide", 422);
  }

  try {
    const { id } = await ctx.params;
    const order = await updateOrderStatusByAdmin({
      orderId: id,
      toStatus: parsed.data.status,
      changedByUserId: auth.user.id,
      note: parsed.data.note,
    });
    return jsonOk({ order });
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "Update statut impossible", 400);
  }
}
