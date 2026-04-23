import { NextRequest } from "next/server";
import { env } from "@/lib/env";
import { jsonError, jsonOk } from "@/lib/http";
import { processPendingPrintJobs } from "@/lib/services/print-service";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const workerKey = request.headers.get("x-print-worker-key");
  if (!env.printWorkerKey || workerKey !== env.printWorkerKey) {
    return jsonError("Unauthorized print worker", 401);
  }

  const processedCount = await processPendingPrintJobs(20);
  return jsonOk({ processedCount });
}
