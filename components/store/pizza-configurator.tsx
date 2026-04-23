"use client";

import { useMemo, useState } from "react";
import { Minus, Plus } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatChf } from "@/lib/money";

type PizzaConfiguratorProps = {
  pizza: {
    id: string;
    basePriceChf: number;
    sizes: Array<{ id: string; name: string; priceDeltaChf: number }>;
    extras: Array<{ id: string; name: string; priceChf: number }>;
  };
};

export function PizzaConfigurator({ pizza }: PizzaConfiguratorProps) {
  const [sizeId, setSizeId] = useState<string | undefined>(pizza.sizes[0]?.id);
  const [extras, setExtras] = useState<Record<string, number>>({});
  const [quantity, setQuantity] = useState(1);
  const [pending, setPending] = useState(false);

  const selectedSize = pizza.sizes.find((size) => size.id === sizeId);
  const extrasTotal = Object.entries(extras).reduce((sum, [extraId, count]) => {
    const extra = pizza.extras.find((item) => item.id === extraId);
    if (!extra) {
      return sum;
    }
    return sum + extra.priceChf * count;
  }, 0);

  const unitPrice = useMemo(() => {
    return pizza.basePriceChf + (selectedSize?.priceDeltaChf ?? 0) + extrasTotal;
  }, [pizza.basePriceChf, selectedSize?.priceDeltaChf, extrasTotal]);

  const total = unitPrice * quantity;

  function updateExtra(extraId: string, checked: boolean) {
    setExtras((current) => {
      const next = { ...current };
      if (!checked) {
        delete next[extraId];
        return next;
      }
      next[extraId] = 1;
      return next;
    });
  }

  async function onAddToCart() {
    setPending(true);
    const payload = {
      pizzaId: pizza.id,
      sizeOptionId: sizeId,
      quantity,
      extras: Object.entries(extras).map(([extraOptionId, qty]) => ({
        extraOptionId,
        quantity: qty,
      })),
    };
    try {
      const response = await fetch("/api/cart", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error ?? "Erreur panier");
      }
      toast.success("Produit ajouté au panier");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erreur panier");
    } finally {
      setPending(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Personnalisez votre pizza</CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="space-y-2">
          <p className="text-sm font-semibold">Taille</p>
          <div className="flex flex-wrap gap-2">
            {pizza.sizes.map((size) => (
              <button
                key={size.id}
                type="button"
                onClick={() => setSizeId(size.id)}
                className={`rounded-full border px-3 py-1 text-sm transition ${
                  size.id === sizeId ? "border-primary bg-primary/10 text-primary" : "border-border"
                }`}
              >
                {size.name}
                {size.priceDeltaChf > 0 ? ` (+${formatChf(size.priceDeltaChf)})` : ""}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <p className="text-sm font-semibold">Suppléments</p>
          <div className="grid gap-2">
            {pizza.extras.map((extra) => {
              const checked = !!extras[extra.id];
              return (
                <label
                  key={extra.id}
                  className="flex items-center justify-between rounded-xl border px-3 py-2 text-sm"
                >
                  <span>{extra.name}</span>
                  <span className="flex items-center gap-2">
                    <Badge variant="outline">{formatChf(extra.priceChf)}</Badge>
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={(event) => updateExtra(extra.id, event.target.checked)}
                    />
                  </span>
                </label>
              );
            })}
          </div>
        </div>

        <div className="flex items-center justify-between rounded-2xl border p-3">
          <div className="flex items-center gap-2">
            <Button
              size="icon"
              variant="outline"
              disabled={quantity <= 1}
              onClick={() => setQuantity((value) => Math.max(1, value - 1))}
            >
              <Minus className="h-4 w-4" />
            </Button>
            <span className="w-6 text-center">{quantity}</span>
            <Button size="icon" variant="outline" onClick={() => setQuantity((value) => value + 1)}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          <span className="text-lg font-semibold">{formatChf(total)}</span>
        </div>

        <Button className="w-full" onClick={onAddToCart} disabled={pending}>
          {pending ? "Ajout..." : "Ajouter au panier"}
        </Button>
      </CardContent>
    </Card>
  );
}
