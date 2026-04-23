import { NextRequest } from "next/server";
import { z } from "zod";
import { jsonError, jsonOk } from "@/lib/http";
import { fromDecimal } from "@/lib/money";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

const schema = z.object({
  postalCode: z.string().regex(/^[1-9]\d{3}$/),
});

export async function GET(request: NextRequest) {
  const parsed = schema.safeParse({
    postalCode: request.nextUrl.searchParams.get("postalCode") ?? "",
  });
  if (!parsed.success) {
    return jsonError("Code postal invalide", 422);
  }

  const zone = await prisma.deliveryZone.findFirst({
    where: {
      isActive: true,
      postalCodes: {
        has: parsed.data.postalCode,
      },
    },
  });

  return jsonOk({
    deliveryFeeChf: zone ? fromDecimal(zone.deliveryFeeChf) : 0,
    zoneName: zone?.name ?? null,
  });
}
