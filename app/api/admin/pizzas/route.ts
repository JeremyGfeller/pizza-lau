import { UserRole } from "@prisma/client";
import { NextRequest } from "next/server";
import { z } from "zod";
import { requireApiRole, requireApiUser } from "@/lib/api-auth";
import { jsonError, jsonOk } from "@/lib/http";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

const createPizzaSchema = z.object({
  slug: z.string().min(3),
  name: z.string().min(2),
  description: z.string().min(4),
  imageUrl: z.string().url(),
  categoryId: z.string().cuid(),
  basePriceChf: z.number().min(5).max(80),
  isAvailable: z.boolean().default(true),
  sizes: z
    .array(
      z.object({
        name: z.string().min(2),
        diameterCm: z.number().int().min(20).max(50).optional(),
        priceDeltaChf: z.number().min(0).max(30),
      }),
    )
    .min(1),
  extraIds: z.array(z.string().cuid()).optional(),
});

export async function GET(request: NextRequest) {
  const auth = await requireApiUser(request);
  if (auth.error) {
    return auth.error;
  }
  const roleError = requireApiRole(auth.user.role, [UserRole.ADMIN, UserRole.STAFF]);
  if (roleError) {
    return roleError;
  }

  const pizzas = await prisma.pizza.findMany({
    include: {
      category: true,
      sizes: {
        orderBy: {
          sortOrder: "asc",
        },
      },
      allowedExtras: {
        include: {
          extra: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  const categories = await prisma.pizzaCategory.findMany({
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
  });
  const extras = await prisma.extraOption.findMany({
    orderBy: { name: "asc" },
  });

  return jsonOk({ pizzas, categories, extras });
}

export async function POST(request: NextRequest) {
  const auth = await requireApiUser(request);
  if (auth.error) {
    return auth.error;
  }
  const roleError = requireApiRole(auth.user.role, [UserRole.ADMIN]);
  if (roleError) {
    return roleError;
  }

  const body = await request.json().catch(() => null);
  const parsed = createPizzaSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError(parsed.error.issues[0]?.message ?? "Payload invalide", 422);
  }

  const pizza = await prisma.pizza.create({
    data: {
      slug: parsed.data.slug,
      name: parsed.data.name,
      description: parsed.data.description,
      imageUrl: parsed.data.imageUrl,
      categoryId: parsed.data.categoryId,
      basePriceChf: parsed.data.basePriceChf,
      isAvailable: parsed.data.isAvailable,
      sizes: {
        create: parsed.data.sizes.map((size, index) => ({
          name: size.name,
          diameterCm: size.diameterCm,
          priceDeltaChf: size.priceDeltaChf,
          sortOrder: index + 1,
        })),
      },
      allowedExtras: {
        create:
          parsed.data.extraIds?.map((extraId) => ({
            extraId,
          })) ?? [],
      },
    },
    include: {
      sizes: true,
      allowedExtras: true,
    },
  });

  return jsonOk({ pizza }, 201);
}
