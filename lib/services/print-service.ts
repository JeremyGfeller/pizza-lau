import { PrintJobStatus } from "@prisma/client";
import { env } from "@/lib/env";
import { fromDecimal } from "@/lib/money";
import { prisma } from "@/lib/prisma";

type TicketPayload = {
  orderId: string;
  orderNumber: number;
  createdAt: string;
  customerName: string;
  customerPhone: string | null;
  pickupMode: "DELIVERY" | "PICKUP";
  address: string | null;
  notes: string | null;
  items: Array<{
    name: string;
    size: string | null;
    quantity: number;
    notes: string | null;
    extras: Array<{
      name: string;
      quantity: number;
    }>;
  }>;
};

async function logPrint(printJobId: string, level: "info" | "error", message: string, payload?: unknown) {
  await prisma.printLog.create({
    data: {
      printJobId,
      level,
      message,
      payload: payload as object | undefined,
    },
  });
}

export async function enqueuePrintJob(orderId: string) {
  const existing = await prisma.printJob.findFirst({
    where: {
      orderId,
      status: {
        in: [PrintJobStatus.QUEUED, PrintJobStatus.PROCESSING],
      },
    },
  });
  if (existing) {
    return existing;
  }

  const job = await prisma.printJob.create({
    data: {
      orderId,
      status: PrintJobStatus.QUEUED,
    },
  });

  await logPrint(job.id, "info", "Print job queued");
  return job;
}

function buildDeliveryAddress(order: {
  deliveryStreet: string | null;
  deliveryPostalCode: string | null;
  deliveryCity: string | null;
}) {
  if (!order.deliveryStreet || !order.deliveryPostalCode || !order.deliveryCity) {
    return null;
  }
  return `${order.deliveryStreet}, ${order.deliveryPostalCode} ${order.deliveryCity}`;
}

function toTicketPayload(order: Awaited<ReturnType<typeof fetchOrderForPrint>>) {
  return {
    orderId: order.id,
    orderNumber: order.orderNumber,
    createdAt: order.createdAt.toISOString(),
    customerName: order.customerName,
    customerPhone: order.customerPhone,
    pickupMode: order.pickupMode,
    address: buildDeliveryAddress(order),
    notes: order.customerNotes,
    items: order.items.map((item) => ({
      name: item.pizzaNameSnapshot,
      size: item.sizeNameSnapshot,
      quantity: item.quantity,
      notes: item.notes,
      extras: item.extras.map((extra) => ({
        name: extra.nameSnapshot,
        quantity: extra.quantity,
      })),
    })),
  } satisfies TicketPayload;
}

async function sendToPrintBridge(payload: TicketPayload, printJobId: string) {
  const response = await fetch(`${env.printBridgeUrl}/print`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-print-worker-key": env.printWorkerKey,
    },
    body: JSON.stringify({
      type: "kitchen-ticket",
      printJobId,
      payload,
    }),
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Print bridge error: ${response.status}`);
  }
}

async function fetchOrderForPrint(orderId: string) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      items: {
        include: {
          extras: true,
        },
      },
    },
  });
  if (!order) {
    throw new Error(`Order ${orderId} not found`);
  }
  return order;
}

async function processJob(jobId: string) {
  const lock = await prisma.printJob.updateMany({
    where: {
      id: jobId,
      status: {
        in: [PrintJobStatus.QUEUED, PrintJobStatus.FAILED],
      },
      lockedAt: null,
      attempts: {
        lt: 5,
      },
    },
    data: {
      status: PrintJobStatus.PROCESSING,
      lockedAt: new Date(),
    },
  });

  if (!lock.count) {
    return;
  }

  const job = await prisma.printJob.findUnique({
    where: { id: jobId },
  });
  if (!job) {
    return;
  }

  try {
    const order = await fetchOrderForPrint(job.orderId);
    const ticket = toTicketPayload(order);
    await sendToPrintBridge(ticket, job.id);

    await prisma.printJob.update({
      where: { id: job.id },
      data: {
        status: PrintJobStatus.SUCCESS,
        attempts: job.attempts + 1,
        lastError: null,
        lockedAt: null,
      },
    });
    await logPrint(job.id, "info", "Ticket printed", {
      orderNumber: order.orderNumber,
      totalChf: fromDecimal(order.totalChf),
    });
  } catch (error) {
    const attempts = job.attempts + 1;
    const retryable = attempts < job.maxAttempts;
    const retryMinutes = Math.min(15, 2 ** attempts);
    await prisma.printJob.update({
      where: { id: job.id },
      data: {
        status: retryable ? PrintJobStatus.QUEUED : PrintJobStatus.FAILED,
        attempts,
        lastError: error instanceof Error ? error.message : "Unknown print error",
        nextAttemptAt: new Date(Date.now() + retryMinutes * 60 * 1000),
        lockedAt: null,
      },
    });
    await logPrint(job.id, "error", "Print failed", {
      attempts,
      retryable,
      error: error instanceof Error ? error.message : "Unknown print error",
    });
  }
}

export async function processPendingPrintJobs(limit = 10) {
  const jobs = await prisma.printJob.findMany({
    where: {
      status: {
        in: [PrintJobStatus.QUEUED, PrintJobStatus.FAILED],
      },
      nextAttemptAt: {
        lte: new Date(),
      },
      attempts: {
        lt: 5,
      },
      lockedAt: null,
    },
    orderBy: [{ createdAt: "asc" }],
    take: limit,
  });

  for (const job of jobs) {
    await processJob(job.id);
  }

  return jobs.length;
}
