import Stripe from "stripe";
import { env } from "@/lib/env";

export const stripe =
  env.stripeSecretKey.trim().length > 0
    ? new Stripe(env.stripeSecretKey, {
        apiVersion: "2025-10-29.clover",
      })
    : null;
