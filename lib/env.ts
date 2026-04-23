function required(name: string) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export const env = {
  get databaseUrl() {
    return required("DATABASE_URL");
  },
  get jwtAccessSecret() {
    return required("JWT_ACCESS_SECRET");
  },
  jwtAccessTtl: process.env.JWT_ACCESS_TTL ?? "2h",
  stripeSecretKey: process.env.STRIPE_SECRET_KEY ?? "",
  stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET ?? "",
  appUrl: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
  printWorkerKey: process.env.PRINT_WORKER_KEY ?? "",
  printBridgeUrl: process.env.PRINT_BRIDGE_URL ?? "http://localhost:5070",
  taxRatePercent: Number(process.env.TAX_RATE_PERCENT ?? "8.1"),
};
