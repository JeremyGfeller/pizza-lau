import { describe, expect, it } from "vitest";
import { checkoutSchema, registerSchema } from "@/lib/validators";

describe("validation rules", () => {
  it("rejects invalid swiss phone", () => {
    const result = registerSchema.safeParse({
      username: "alex",
      fullName: "Alex Test",
      password: "Strong123!",
      phone: "0791234567",
      email: "alex@test.ch",
    });
    expect(result.success).toBe(false);
  });

  it("requires delivery address when pickup mode is DELIVERY", () => {
    const result = checkoutSchema.safeParse({
      pickupMode: "DELIVERY",
      customerName: "Alex Test",
      customerPhone: "+41791234567",
      customerEmail: "alex@test.ch",
    });
    expect(result.success).toBe(false);
  });
});
