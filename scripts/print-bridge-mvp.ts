import { createServer } from "node:http";
import { mkdir, appendFile } from "node:fs/promises";
import { join } from "node:path";

const PORT = Number(process.env.PRINT_BRIDGE_PORT ?? "5070");
const PRINT_WORKER_KEY = process.env.PRINT_WORKER_KEY ?? "";
const spoolDir = join(process.cwd(), "print-spool");

if (!PRINT_WORKER_KEY) {
  throw new Error("Missing PRINT_WORKER_KEY");
}

const server = createServer(async (req, res) => {
  if (req.method !== "POST" || req.url !== "/print") {
    res.writeHead(404);
    res.end("Not found");
    return;
  }

  if (req.headers["x-print-worker-key"] !== PRINT_WORKER_KEY) {
    res.writeHead(401);
    res.end("Unauthorized");
    return;
  }

  let raw = "";
  req.on("data", (chunk) => {
    raw += chunk;
  });

  req.on("end", async () => {
    try {
      const payload = JSON.parse(raw);
      await mkdir(spoolDir, { recursive: true });
      const filePath = join(spoolDir, `${new Date().toISOString().slice(0, 10)}.log`);

      const ticketText = [
        "==============================",
        `JOB: ${payload.printJobId}`,
        `DATE: ${new Date().toLocaleString("fr-CH")}`,
        `COMMANDE #${payload.payload.orderNumber}`,
        `CLIENT: ${payload.payload.customerName}`,
        `MODE: ${payload.payload.pickupMode}`,
        payload.payload.address ? `ADRESSE: ${payload.payload.address}` : "",
        "---- ITEMS ----",
        ...payload.payload.items.map(
          (item: { quantity: number; name: string; size?: string; extras?: Array<{ name: string; quantity: number }> }) =>
            `${item.quantity}x ${item.name}${item.size ? ` (${item.size})` : ""}${
              item.extras?.length
                ? `\n  + ${item.extras.map((extra) => `${extra.name} x${extra.quantity}`).join(", ")}`
                : ""
            }`,
        ),
        payload.payload.notes ? `NOTE: ${payload.payload.notes}` : "",
        "==============================",
        "",
      ]
        .filter(Boolean)
        .join("\n");

      await appendFile(filePath, ticketText, "utf8");
      res.writeHead(200, { "content-type": "application/json" });
      res.end(JSON.stringify({ ok: true }));
    } catch (error) {
      res.writeHead(500);
      res.end(error instanceof Error ? error.message : "Print bridge error");
    }
  });
});

server.listen(PORT, () => {
  console.log(`[print-bridge] listening on http://localhost:${PORT}`);
  console.log("[print-bridge] MVP mode: tickets are written to /print-spool/*.log");
});
