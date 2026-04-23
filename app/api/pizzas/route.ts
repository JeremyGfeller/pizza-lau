import { jsonOk } from "@/lib/http";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function GET() {
  const pizzas = await prisma.pizza.findMany({
    where: {
      isAvailable: true,
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
    orderBy: [{ category: { sortOrder: "asc" } }, { name: "asc" }],
  });
  return jsonOk({ pizzas });
}
