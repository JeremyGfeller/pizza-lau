const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
const PRINT_WORKER_KEY = process.env.PRINT_WORKER_KEY ?? "";
const INTERVAL_MS = Number(process.env.PRINT_WORKER_INTERVAL_MS ?? "8000");

if (!PRINT_WORKER_KEY) {
  throw new Error("Missing PRINT_WORKER_KEY");
}

async function tick() {
  try {
    const response = await fetch(`${APP_URL}/api/internal/print-worker`, {
      method: "POST",
      headers: {
        "x-print-worker-key": PRINT_WORKER_KEY,
      },
    });
    if (!response.ok) {
      console.error(`[print-worker] failed with status ${response.status}`);
      return;
    }
    const data = await response.json();
    if (data.processedCount > 0) {
      console.log(`[print-worker] processed ${data.processedCount} job(s)`);
    }
  } catch (error) {
    console.error("[print-worker] network error", error);
  }
}

console.log(`[print-worker] started on ${APP_URL}, interval ${INTERVAL_MS}ms`);
void tick();
setInterval(() => {
  void tick();
}, INTERVAL_MS);
