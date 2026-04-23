import { UserRole } from "@prisma/client";
import { NextRequest } from "next/server";
import { requireApiRole, requireApiUser } from "@/lib/api-auth";
import { jsonError, jsonOk } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { updateUserRoleSchema } from "@/lib/validators";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const auth = await requireApiUser(request);
  if (auth.error) {
    return auth.error;
  }
  const roleError = requireApiRole(auth.user.role, [UserRole.ADMIN]);
  if (roleError) {
    return roleError;
  }

  const users = await prisma.user.findMany({
    select: {
      id: true,
      username: true,
      fullName: true,
      email: true,
      role: true,
      createdAt: true,
      _count: {
        select: { orders: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });
  return jsonOk({ users });
}

export async function PATCH(request: NextRequest) {
  const auth = await requireApiUser(request);
  if (auth.error) {
    return auth.error;
  }
  const roleError = requireApiRole(auth.user.role, [UserRole.ADMIN]);
  if (roleError) {
    return roleError;
  }

  const body = await request.json().catch(() => null);
  const parsed = updateUserRoleSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError(parsed.error.issues[0]?.message ?? "Payload invalide", 422);
  }

  const user = await prisma.user.update({
    where: {
      id: parsed.data.userId,
    },
    data: {
      role: parsed.data.role,
    },
    select: {
      id: true,
      username: true,
      role: true,
    },
  });

  return jsonOk({ user });
}
