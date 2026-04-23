import Image from "next/image";
import { notFound } from "next/navigation";
import { PizzaConfigurator } from "@/components/store/pizza-configurator";
import { Badge } from "@/components/ui/badge";
import { prisma } from "@/lib/prisma";

export default async function PizzaDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const pizza = await prisma.pizza.findUnique({
    where: { slug },
    include: {
      category: true,
      sizes: {
        where: { isActive: true },
        orderBy: { sortOrder: "asc" },
      },
      allowedExtras: {
        where: { extra: { isActive: true } },
        include: { extra: true },
      },
    },
  });

  if (!pizza) {
    notFound();
  }

  return (
    <div className="page-shell">
      <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-5">
          <div className="relative h-72 overflow-hidden rounded-3xl sm:h-[28rem]">
            <Image
              src={pizza.imageUrl}
              alt={pizza.name}
              fill
              priority
              className="object-cover"
              sizes="(max-width: 1024px) 100vw, 60vw"
            />
          </div>
          <div className="space-y-3">
            <Badge variant="secondary">{pizza.category.name}</Badge>
            <h1 className="font-display text-3xl font-semibold">{pizza.name}</h1>
            <p className="text-muted-foreground">{pizza.description}</p>
          </div>
        </div>

        <PizzaConfigurator
          pizza={{
            id: pizza.id,
            basePriceChf: Number(pizza.basePriceChf),
            sizes: pizza.sizes.map((size) => ({
              id: size.id,
              name: size.name,
              priceDeltaChf: Number(size.priceDeltaChf),
            })),
            extras: pizza.allowedExtras.map((item) => ({
              id: item.extra.id,
              name: item.extra.name,
              priceChf: Number(item.extra.priceChf),
            })),
          }}
        />
      </div>
    </div>
  );
}
