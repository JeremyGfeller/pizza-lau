import { OrderStatus } from "@prisma/client";
import { describe, expect, it } from "vitest";
import { canTransition } from "@/lib/order-status";

describe("order status transitions", () => {
  it("allows PAID -> PREPARING", () => {
    expect(canTransition(OrderStatus.PAID, OrderStatus.PREPARING)).toBe(true);
  });

  it("rejects DELIVERED -> PREPARING", () => {
    expect(canTransition(OrderStatus.DELIVERED, OrderStatus.PREPARING)).toBe(false);
  });
});
