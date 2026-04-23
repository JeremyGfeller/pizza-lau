"use client";

import { OrderStatus } from "@prisma/client";
import { useEffect, useState } from "react";
import { OrderStatusTimeline } from "@/components/store/order-status-timeline";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatChf } from "@/lib/money";
import { ORDER_STATUS_LABEL } from "@/lib/order-status";

type OrderView = {
  id: string;
  orderNumber: number;
  pickupMode: "DELIVERY" | "PICKUP";
  status: OrderStatus;
  totalChf: number;
  customerName: string;
  customerPhone: string | null;
  deliveryStreet: string | null;
  deliveryPostalCode: string | null;
  deliveryCity: string | null;
  customerNotes: string | null;
  createdAt: string;
  items: Array<{
    id: string;
    pizzaNameSnapshot: string;
    sizeNameSnapshot: string | null;
    quantity: number;
    lineTotalChf: number;
    extras: Array<{ id: string; nameSnapshot: string; quantity: number }>;
  }>;
  statusHistory: Array<{
    id: string;
    toStatus: OrderStatus;
    note: string | null;
    createdAt: string;
  }>;
};

export function OrderTrackingLive({ initialOrder }: { initialOrder: OrderView }) {
  const [order, setOrder] = useState(initialOrder);

  useEffect(() => {
    const interval = setInterval(async () => {
      const response = await fetch(`/api/orders/${order.id}`, { cache: "no-store" });
      if (!response.ok) {
        return;
      }
      const data = await response.json();
      setOrder({
        ...data.order,
        totalChf: Number(data.order.totalChf),
        createdAt: data.order.createdAt,
        items: data.order.items.map((item: OrderView["items"][number]) => ({
          ...item,
          lineTotalChf: Number(item.lineTotalChf),
        })),
      });
    }, 10000);

    return () => clearInterval(interval);
  }, [order.id]);

  const deliveryAddress =
    order.deliveryStreet && order.deliveryPostalCode && order.deliveryCity
      ? `${order.deliveryStreet}, ${order.deliveryPostalCode} ${order.deliveryCity}`
      : null;

  return (
    <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
      <Card>
        <CardHeader>
          <CardTitle>Suivi #{order.orderNumber}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <OrderStatusTimeline status={order.status} pickupMode={order.pickupMode} />
          <div className="text-sm text-muted-foreground">
            <p>Client: {order.customerName}</p>
            {order.customerPhone ? <p>Téléphone: {order.customerPhone}</p> : null}
            {deliveryAddress ? <p>Adresse: {deliveryAddress}</p> : null}
          </div>
          {order.customerNotes ? (
            <div className="rounded-xl border bg-muted/30 p-3 text-sm">{order.customerNotes}</div>
          ) : null}
        </CardContent>
      </Card>

      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Détail de la commande</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {order.items.map((item) => (
              <div key={item.id} className="rounded-xl border p-3 text-sm">
                <div className="flex items-center justify-between">
                  <p className="font-medium">
                    {item.quantity}x {item.pizzaNameSnapshot}
                  </p>
                  <p>{formatChf(item.lineTotalChf)}</p>
                </div>
                {item.sizeNameSnapshot ? (
                  <p className="text-xs text-muted-foreground">{item.sizeNameSnapshot}</p>
                ) : null}
                {item.extras.length ? (
                  <p className="text-xs text-muted-foreground">
                    Suppléments:{" "}
                    {item.extras.map((extra) => `${extra.nameSnapshot} x${extra.quantity}`).join(", ")}
                  </p>
                ) : null}
              </div>
            ))}
            <div className="flex items-center justify-between border-t pt-3 text-sm font-semibold">
              <span>Total</span>
              <span>{formatChf(order.totalChf)}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Historique des statuts</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {order.statusHistory.map((history) => (
              <div key={history.id} className="flex items-start justify-between rounded-xl border p-3 text-sm">
                <div>
                  <Badge variant="outline">{ORDER_STATUS_LABEL[history.toStatus]}</Badge>
                  {history.note ? <p className="mt-1 text-muted-foreground">{history.note}</p> : null}
                </div>
                <span className="text-xs text-muted-foreground">
                  {new Date(history.createdAt).toLocaleString("fr-CH")}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
