import { OrderStatus, UserRole } from "@prisma/client";
import { NextRequest } from "next/server";
import { z } from "zod";
import { requireApiRole, requireApiUser } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

const querySchema = z.object({
  q: z.string().optional(),
  status: z.nativeEnum(OrderStatus).optional(),
  take: z.coerce.number().int().min(1).max(100).default(30),
});

export async function GET(request: NextRequest) {
  const auth = await requireApiUser(request);
  if (auth.error) {
    return auth.error;
  }
  const roleError = requireApiRole(auth.user.role, [UserRole.ADMIN, UserRole.STAFF]);
  if (roleError) {
    return roleError;
  }

  const parse = querySchema.safeParse({
    q: request.nextUrl.searchParams.get("q") ?? undefined,
    status: request.nextUrl.searchParams.get("status") ?? undefined,
    take: request.nextUrl.searchParams.get("take") ?? undefined,
  });
  if (!parse.success) {
    return Response.json({ error: "Paramètres invalides" }, { status: 422 });
  }

  const { q, status, take } = parse.data;
  const orders = await prisma.order.findMany({
    where: {
      status,
      OR: q
        ? [
            { customerName: { contains: q, mode: "insensitive" } },
            { customerPhone: { contains: q } },
            { user: { username: { contains: q, mode: "insensitive" } } },
          ]
        : undefined,
    },
    include: {
      user: {
        select: {
          username: true,
        },
      },
      items: {
        select: {
          id: true,
          pizzaNameSnapshot: true,
          quantity: true,
        },
      },
      printJobs: {
        take: 1,
        orderBy: { createdAt: "desc" },
      },
    },
    orderBy: [{ createdAt: "desc" }],
    take,
  });

  return Response.json({ orders });
}
