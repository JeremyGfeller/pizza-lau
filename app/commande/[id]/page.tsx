import { notFound } from "next/navigation";
import { OrderTrackingLive } from "@/components/store/order-tracking-live";
import { fromDecimal } from "@/lib/money";
import { getOrderByIdForUser } from "@/lib/services/order-service";
import { requirePageUser } from "@/lib/server-auth";

export default async function OrderTrackingPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requirePageUser("/compte");
  const { id } = await params;
  const order = await getOrderByIdForUser(id, user.id, user.role);
  if (!order) {
    notFound();
  }

  return (
    <div className="page-shell">
      <OrderTrackingLive
        initialOrder={{
          id: order.id,
          orderNumber: order.orderNumber,
          pickupMode: order.pickupMode,
          status: order.status,
          totalChf: fromDecimal(order.totalChf),
          customerName: order.customerName,
          customerPhone: order.customerPhone,
          deliveryStreet: order.deliveryStreet,
          deliveryPostalCode: order.deliveryPostalCode,
          deliveryCity: order.deliveryCity,
          customerNotes: order.customerNotes,
          createdAt: order.createdAt.toISOString(),
          items: order.items.map((item) => ({
            id: item.id,
            pizzaNameSnapshot: item.pizzaNameSnapshot,
            sizeNameSnapshot: item.sizeNameSnapshot,
            quantity: item.quantity,
            lineTotalChf: fromDecimal(item.lineTotalChf),
            extras: item.extras.map((extra) => ({
              id: extra.id,
              nameSnapshot: extra.nameSnapshot,
              quantity: extra.quantity,
            })),
          })),
          statusHistory: order.statusHistory.map((history) => ({
            id: history.id,
            toStatus: history.toStatus,
            note: history.note,
            createdAt: history.createdAt.toISOString(),
          })),
        }}
      />
    </div>
  );
}
