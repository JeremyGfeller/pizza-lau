import { PizzaCard } from "@/components/store/pizza-card";
import { Badge } from "@/components/ui/badge";
import { prisma } from "@/lib/prisma";

export const metadata = {
  title: "Boutique | Pizza Lau",
};

export default async function BoutiquePage() {
  const categories = await prisma.pizzaCategory.findMany({
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    include: {
      pizzas: {
        where: { isAvailable: true },
        include: {
          category: true,
          sizes: {
            where: { isActive: true },
            orderBy: { sortOrder: "asc" },
          },
        },
      },
    },
  });

  return (
    <div className="page-shell space-y-8">
      <div className="space-y-3">
        <Badge>Carte du moment</Badge>
        <h1 className="font-display text-3xl font-semibold sm:text-4xl">Choisissez votre pizza</h1>
        <p className="max-w-2xl text-muted-foreground">
          Prix en CHF, options de taille et suppléments, panier instantané.
        </p>
      </div>

      <div className="space-y-10">
        {categories.map((category) => (
          <section key={category.id} className="space-y-4">
            <h2 className="font-display text-2xl font-semibold">{category.name}</h2>
            {category.pizzas.length === 0 ? (
              <p className="text-sm text-muted-foreground">Aucune pizza disponible.</p>
            ) : (
              <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                {category.pizzas.map((pizza) => (
                  <PizzaCard key={pizza.id} pizza={pizza} />
                ))}
              </div>
            )}
          </section>
        ))}
      </div>
    </div>
  );
}
