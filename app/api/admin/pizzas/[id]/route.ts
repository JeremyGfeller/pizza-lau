import { UserRole } from "@prisma/client";
import { NextRequest } from "next/server";
import { z } from "zod";
import { requireApiRole, requireApiUser } from "@/lib/api-auth";
import { jsonError, jsonOk } from "@/lib/http";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

const updatePizzaSchema = z.object({
  name: z.string().min(2).optional(),
  description: z.string().min(4).optional(),
  imageUrl: z.string().url().optional(),
  basePriceChf: z.number().min(5).max(80).optional(),
  isAvailable: z.boolean().optional(),
  categoryId: z.string().cuid().optional(),
});

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
  const parsed = updatePizzaSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError(parsed.error.issues[0]?.message ?? "Payload invalide", 422);
  }
  const { id } = await ctx.params;
  const pizza = await prisma.pizza.update({
    where: { id },
    data: parsed.data,
  });
  return jsonOk({ pizza });
}

export async function DELETE(request: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const auth = await requireApiUser(request);
  if (auth.error) {
    return auth.error;
  }
  const roleError = requireApiRole(auth.user.role, [UserRole.ADMIN]);
  if (roleError) {
    return roleError;
  }

  const { id } = await ctx.params;
  await prisma.pizza.delete({
    where: { id },
  });
  return jsonOk({ ok: true });
}
