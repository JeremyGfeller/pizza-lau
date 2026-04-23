import Image from "next/image";
import Link from "next/link";
import { AddToCartButton } from "@/components/store/add-to-cart-button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { formatChf, fromDecimal } from "@/lib/money";

type PizzaCardProps = {
  pizza: {
    id: string;
    slug: string;
    name: string;
    description: string;
    imageUrl: string;
    basePriceChf: string | number | { toString(): string };
    category: { name: string };
    sizes: Array<{
      id: string;
      name: string;
      priceDeltaChf: string | number | { toString(): string };
    }>;
  };
};

export function PizzaCard({ pizza }: PizzaCardProps) {
  const firstSize = pizza.sizes[0];
  const basePrice = fromDecimal(pizza.basePriceChf) + fromDecimal(firstSize?.priceDeltaChf);
  return (
    <Card className="group overflow-hidden p-0">
      <Link href={`/boutique/${pizza.slug}`} className="block">
        <div className="relative h-44 overflow-hidden">
          <Image
            src={pizza.imageUrl}
            alt={pizza.name}
            fill
            className="object-cover transition duration-300 group-hover:scale-105"
            sizes="(max-width: 768px) 100vw, 33vw"
          />
        </div>
      </Link>
      <CardHeader className="p-5 pb-0">
        <Badge variant="secondary" className="mb-2 w-fit">
          {pizza.category.name}
        </Badge>
        <CardTitle className="text-lg">{pizza.name}</CardTitle>
      </CardHeader>
      <CardContent className="px-5">
        <p className="line-clamp-2 text-sm text-muted-foreground">{pizza.description}</p>
      </CardContent>
      <CardFooter className="justify-between px-5 pb-5">
        <p className="text-sm font-semibold">Dès {formatChf(basePrice)}</p>
        <AddToCartButton pizzaId={pizza.id} sizeOptionId={firstSize?.id} />
      </CardFooter>
    </Card>
  );
}
