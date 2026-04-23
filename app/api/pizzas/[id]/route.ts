import { NextRequest } from "next/server";
import { jsonError, jsonOk } from "@/lib/http";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function GET(_request: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;

  const pizza = await prisma.pizza.findFirst({
    where: {
      OR: [{ id }, { slug: id }],
    },
    include: {
      category: true,
      sizes: {
        where: { isActive: true },
        orderBy: { sortOrder: "asc" },
      },
      allowedExtras: {
        include: {
          extra: true,
        },
      },
    },
  });
  if (!pizza) {
    return jsonError("Pizza introuvable", 404);
  }
  return jsonOk({ pizza });
}
