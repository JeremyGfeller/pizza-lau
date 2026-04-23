import { OrderStatus, PaymentStatus, UserRole } from "@prisma/client";
import { NextRequest } from "next/server";
import { requireApiRole, requireApiUser } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

function startOfMonth(date: Date) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1));
}

export async function GET(request: NextRequest) {
  const auth = await requireApiUser(request);
  if (auth.error) {
    return auth.error;
  }
  const roleError = requireApiRole(auth.user.role, [UserRole.ADMIN, UserRole.STAFF]);
  if (roleError) {
    return roleError;
  }

  const monthStart = startOfMonth(new Date());
  const [daily, topProducts, avgBasket, cancelled] = await Promise.all([
    prisma.$queryRaw<Array<{ day: Date; revenue: number; orders: number }>>`
      SELECT date_trunc('day', "createdAt") AS day, 
             SUM(CASE WHEN "paymentStatus" = 'SUCCEEDED' THEN "totalChf" ELSE 0 END)::float AS revenue,
             COUNT(*)::int AS orders
      FROM "Order"
      WHERE "createdAt" >= ${monthStart}
      GROUP BY 1
      ORDER BY 1 DESC
      LIMIT 31
    `,
    prisma.orderItem.groupBy({
      by: ["pizzaNameSnapshot"],
      _sum: {
        quantity: true,
      },
      orderBy: {
        _sum: {
          quantity: "desc",
        },
      },
      take: 10,
    }),
    prisma.order.aggregate({
      where: {
        paymentStatus: PaymentStatus.SUCCEEDED,
      },
      _avg: {
        totalChf: true,
      },
    }),
    prisma.order.count({
      where: { status: OrderStatus.CANCELLED },
    }),
  ]);

  return Response.json({
    daily,
    topProducts,
    avgBasket: avgBasket._avg.totalChf ?? 0,
    cancelled,
  });
}
