import { OrderStatus } from "@prisma/client";

export const ORDER_STATUS_LABEL: Record<OrderStatus, string> = {
  PENDING: "En attente",
  PAID: "Payée",
  PREPARING: "En préparation",
  READY: "Prête",
  OUT_FOR_DELIVERY: "En livraison",
  DELIVERED: "Livrée",
  PICKED_UP: "Récupérée",
  CANCELLED: "Annulée",
};

const TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  PENDING: [OrderStatus.PAID, OrderStatus.CANCELLED],
  PAID: [OrderStatus.PREPARING, OrderStatus.CANCELLED],
  PREPARING: [OrderStatus.READY, OrderStatus.CANCELLED],
  READY: [OrderStatus.OUT_FOR_DELIVERY, OrderStatus.PICKED_UP, OrderStatus.CANCELLED],
  OUT_FOR_DELIVERY: [OrderStatus.DELIVERED, OrderStatus.CANCELLED],
  DELIVERED: [],
  PICKED_UP: [],
  CANCELLED: [],
};

export function canTransition(from: OrderStatus, to: OrderStatus) {
  return from === to || TRANSITIONS[from].includes(to);
}

export function statusProgress(status: OrderStatus) {
  switch (status) {
    case OrderStatus.PENDING:
      return 8;
    case OrderStatus.PAID:
      return 25;
    case OrderStatus.PREPARING:
      return 45;
    case OrderStatus.READY:
      return 70;
    case OrderStatus.OUT_FOR_DELIVERY:
      return 85;
    case OrderStatus.DELIVERED:
    case OrderStatus.PICKED_UP:
      return 100;
    case OrderStatus.CANCELLED:
      return 0;
    default:
      return 0;
  }
}
