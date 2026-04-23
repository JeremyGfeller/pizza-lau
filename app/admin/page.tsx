import { OrderStatus, PaymentStatus } from "@prisma/client";
import { Activity, Clock, CookingPot, ReceiptText, Truck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatChf, fromDecimal } from "@/lib/money";
import { ORDER_STATUS_LABEL } from "@/lib/order-status";
import { prisma } from "@/lib/prisma";

function MetricCard({
  title,
  value,
  icon: Icon,
}: {
  title: string;
  value: string;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <Card>
      <CardContent className="flex items-center justify-between pt-6">
        <div>
          <p className="text-sm text-muted-foreground">{title}</p>
          <p className="text-2xl font-semibold">{value}</p>
        </div>
        <Icon className="h-5 w-5 text-primary" />
      </CardContent>
    </Card>
  );
}

export default async function AdminPage() {
  const [totalOrders, pending, preparing, ready, delivery, paidRevenue, recent, printQueue] =
    await Promise.all([
      prisma.order.count(),
      prisma.order.count({
        where: { status: { in: [OrderStatus.PENDING, OrderStatus.PAID] } },
      }),
      prisma.order.count({ where: { status: OrderStatus.PREPARING } }),
      prisma.order.count({ where: { status: OrderStatus.READY } }),
      prisma.order.count({ where: { status: OrderStatus.OUT_FOR_DELIVERY } }),
      prisma.order.aggregate({
        where: {
          paymentStatus: PaymentStatus.SUCCEEDED,
        },
        _sum: {
          totalChf: true,
        },
      }),
      prisma.order.findMany({
        take: 8,
        orderBy: { createdAt: "desc" },
      }),
      prisma.printJob.findMany({
        orderBy: { createdAt: "desc" },
        take: 6,
      }),
    ]);

  return (
    <div className="space-y-6">
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <MetricCard title="Commandes totales" value={String(totalOrders)} icon={ReceiptText} />
        <MetricCard title="En attente / payées" value={String(pending)} icon={Clock} />
        <MetricCard title="En préparation" value={String(preparing)} icon={CookingPot} />
        <MetricCard title="En livraison" value={String(delivery)} icon={Truck} />
        <MetricCard title="CA (CHF)" value={formatChf(fromDecimal(paidRevenue._sum.totalChf))} icon={Activity} />
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Activité récente</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {recent.map((order) => (
              <div key={order.id} className="flex items-center justify-between rounded-xl border p-3 text-sm">
                <div>
                  <p className="font-medium">#{order.orderNumber}</p>
                  <p className="text-muted-foreground">{order.customerName}</p>
                </div>
                <div className="text-right">
                  <Badge>{ORDER_STATUS_LABEL[order.status]}</Badge>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {new Date(order.createdAt).toLocaleString("fr-CH")}
                  </p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Queue impression cuisine</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {printQueue.length === 0 ? (
              <p className="text-sm text-muted-foreground">Aucun job d&apos;impression.</p>
            ) : (
              printQueue.map((job) => (
                <div key={job.id} className="flex items-center justify-between rounded-xl border p-3 text-sm">
                  <p className="font-medium">Job {job.id.slice(0, 8)}</p>
                  <Badge variant={job.status === "FAILED" ? "destructive" : "outline"}>
                    {job.status}
                  </Badge>
                </div>
              ))
            )}
            <div className="rounded-xl border bg-muted/30 p-3 text-xs text-muted-foreground">
              {ready} commandes prêtes actuellement.
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
