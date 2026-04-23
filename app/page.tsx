import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Bike, ChefHat, Clock3 } from "lucide-react";
import { PizzaCard } from "@/components/store/pizza-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { prisma } from "@/lib/prisma";

export default async function Home() {
  const featured = await prisma.pizza.findMany({
    where: { isAvailable: true },
    include: {
      category: true,
      sizes: {
        where: { isActive: true },
        orderBy: { sortOrder: "asc" },
      },
    },
    take: 3,
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="page-shell space-y-10">
      <section className="grid gap-8 rounded-[2rem] border bg-radial-warm p-6 sm:p-10 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-6">
          <Badge className="w-fit">Livraison Lausanne • Retrait cuisine</Badge>
          <h1 className="font-display text-4xl font-bold tracking-tight sm:text-5xl">
            Pizzas artisanales premium,
            <span className="text-primary"> commande ultra fluide.</span>
          </h1>
          <p className="max-w-xl text-muted-foreground">
            En moins de 2 minutes: choisissez, payez en CHF via Stripe, suivez votre commande en
            direct.
          </p>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button asChild size="lg">
              <Link href="/boutique">
                Commander maintenant
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href="/compte">Suivre ma commande</Link>
            </Button>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <Card className="p-4">
              <CardContent className="p-0 text-sm">
                <Clock3 className="mb-2 h-4 w-4 text-primary" />
                <p className="font-semibold">Prête en 15-20 min</p>
              </CardContent>
            </Card>
            <Card className="p-4">
              <CardContent className="p-0 text-sm">
                <Bike className="mb-2 h-4 w-4 text-primary" />
                <p className="font-semibold">Livraison locale</p>
              </CardContent>
            </Card>
            <Card className="p-4">
              <CardContent className="p-0 text-sm">
                <ChefHat className="mb-2 h-4 w-4 text-primary" />
                <p className="font-semibold">Pâte maison</p>
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="relative h-72 overflow-hidden rounded-3xl sm:h-[28rem]">
          <Image
            src="https://images.unsplash.com/photo-1548365328-9f547fb0953e?q=80&w=1800&auto=format&fit=crop"
            alt="Pizza signature"
            fill
            priority
            className="object-cover"
          />
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-2xl font-semibold">Nos best-sellers</h2>
          <Button variant="ghost" asChild>
            <Link href="/boutique">Voir toute la carte</Link>
          </Button>
        </div>
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {featured.map((pizza) => (
            <PizzaCard key={pizza.id} pizza={pizza} />
          ))}
        </div>
      </section>
    </div>
  );
}
