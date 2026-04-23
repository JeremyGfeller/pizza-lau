import { OrderStatus, PaymentStatus, UserRole } from "@prisma/client";
import { NextRequest } from "next/server";
import { requireApiRole, requireApiUser } from "@/lib/api-auth";
import { fromDecimal } from "@/lib/money";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const auth = await requireApiUser(request);
  if (auth.error) {
    return auth.error;
  }
  const roleError = requireApiRole(auth.user.role, [UserRole.ADMIN, UserRole.STAFF]);
  if (roleError) {
    return roleError;
  }

  const [totalOrders, revenueAgg, statusCounts, recentActivity] = await Promise.all([
    prisma.order.count(),
    prisma.order.aggregate({
      where: { paymentStatus: PaymentStatus.SUCCEEDED },
      _sum: { totalChf: true },
    }),
    prisma.order.groupBy({
      by: ["status"],
      _count: true,
    }),
    prisma.orderStatusLog.findMany({
      take: 8,
      orderBy: { createdAt: "desc" },
      include: {
        order: {
          select: {
            id: true,
            orderNumber: true,
          },
        },
        changedBy: {
          select: {
            id: true,
            username: true,
          },
        },
      },
    }),
  ]);

  const counts = {
    pending: 0,
    preparing: 0,
    ready: 0,
    outForDelivery: 0,
    deliveredOrPicked: 0,
    cancelled: 0,
  };

  for (const item of statusCounts) {
    if (item.status === OrderStatus.PENDING || item.status === OrderStatus.PAID) {
      counts.pending += item._count;
    }
    if (item.status === OrderStatus.PREPARING) {
      counts.preparing = item._count;
    }
    if (item.status === OrderStatus.READY) {
      counts.ready = item._count;
    }
    if (item.status === OrderStatus.OUT_FOR_DELIVERY) {
      counts.outForDelivery = item._count;
    }
    if (item.status === OrderStatus.DELIVERED || item.status === OrderStatus.PICKED_UP) {
      counts.deliveredOrPicked += item._count;
    }
    if (item.status === OrderStatus.CANCELLED) {
      counts.cancelled = item._count;
    }
  }

  return Response.json({
    metrics: {
      totalOrders,
      revenueChf: fromDecimal(revenueAgg._sum.totalChf),
      ...counts,
    },
    recentActivity,
  });
}
