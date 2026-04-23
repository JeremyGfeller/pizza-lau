"use client";

import { useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { formatChf } from "@/lib/money";

type PizzaRow = {
  id: string;
  slug: string;
  name: string;
  basePriceChf: number;
  isAvailable: boolean;
  category: { id: string; name: string };
  sizes: Array<{ id: string; name: string; priceDeltaChf: number }>;
};

type CatalogPayload = {
  pizzas: PizzaRow[];
  categories: Array<{ id: string; name: string }>;
  extras: Array<{ id: string; name: string }>;
};

export function ProductsBoard() {
  const [catalog, setCatalog] = useState<CatalogPayload | null>(null);
  const [open, setOpen] = useState(false);
  const [formState, setFormState] = useState({
    slug: "",
    name: "",
    description: "",
    imageUrl: "",
    categoryId: "",
    basePriceChf: "16.9",
  });

  async function loadCatalog() {
    const response = await fetch("/api/admin/pizzas", { cache: "no-store" });
    const data = await response.json();
    if (!response.ok) {
      toast.error(data.error ?? "Erreur chargement produits");
      return;
    }
    setCatalog({
      ...data,
      pizzas: data.pizzas.map((pizza: PizzaRow) => ({
        ...pizza,
        basePriceChf: Number(pizza.basePriceChf),
        sizes: pizza.sizes.map((size) => ({
          ...size,
          priceDeltaChf: Number(size.priceDeltaChf),
        })),
      })),
    });
  }

  useEffect(() => {
    let mounted = true;
    fetch("/api/admin/pizzas", { cache: "no-store" })
      .then((response) => response.json())
      .then((data) => {
        if (!mounted) {
          return;
        }
        setCatalog({
          ...data,
          pizzas: data.pizzas.map((pizza: PizzaRow) => ({
            ...pizza,
            basePriceChf: Number(pizza.basePriceChf),
            sizes: pizza.sizes.map((size) => ({
              ...size,
              priceDeltaChf: Number(size.priceDeltaChf),
            })),
          })),
        });
      })
      .catch(() => {
        if (mounted) {
          toast.error("Erreur chargement produits");
        }
      });
    return () => {
      mounted = false;
    };
  }, []);

  async function toggleAvailability(pizzaId: string, isAvailable: boolean) {
    const response = await fetch(`/api/admin/pizzas/${pizzaId}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ isAvailable: !isAvailable }),
    });
    const data = await response.json();
    if (!response.ok) {
      toast.error(data.error ?? "Erreur mise à jour");
      return;
    }
    toast.success("Disponibilité mise à jour");
    await loadCatalog();
  }

  async function onCreate() {
    if (!catalog?.categories.length) {
      return;
    }
    const response = await fetch("/api/admin/pizzas", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        ...formState,
        basePriceChf: Number(formState.basePriceChf),
        categoryId: formState.categoryId || catalog.categories[0].id,
        sizes: [
          { name: "Moyenne 30cm", diameterCm: 30, priceDeltaChf: 0 },
          { name: "Grande 35cm", diameterCm: 35, priceDeltaChf: 4 },
        ],
      }),
    });
    const data = await response.json();
    if (!response.ok) {
      toast.error(data.error ?? "Création impossible");
      return;
    }
    toast.success("Pizza créée");
    setOpen(false);
    setFormState({
      slug: "",
      name: "",
      description: "",
      imageUrl: "",
      categoryId: "",
      basePriceChf: "16.9",
    });
    await loadCatalog();
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Nouvelle pizza
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Ajouter une pizza</DialogTitle>
              <DialogDescription>Création rapide avec tailles standard.</DialogDescription>
            </DialogHeader>
            <div className="space-y-3">
              <Input
                placeholder="Nom"
                value={formState.name}
                onChange={(event) => setFormState((s) => ({ ...s, name: event.target.value }))}
              />
              <Input
                placeholder="Slug"
                value={formState.slug}
                onChange={(event) => setFormState((s) => ({ ...s, slug: event.target.value }))}
              />
              <Input
                placeholder="Description"
                value={formState.description}
                onChange={(event) => setFormState((s) => ({ ...s, description: event.target.value }))}
              />
              <Input
                placeholder="Image URL"
                value={formState.imageUrl}
                onChange={(event) => setFormState((s) => ({ ...s, imageUrl: event.target.value }))}
              />
              <div className="grid grid-cols-2 gap-2">
                <select
                  className="h-11 rounded-2xl border bg-background px-3 text-sm"
                  value={formState.categoryId}
                  onChange={(event) => setFormState((s) => ({ ...s, categoryId: event.target.value }))}
                >
                  <option value="">Catégorie</option>
                  {catalog?.categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
                <Input
                  placeholder="Prix base CHF"
                  value={formState.basePriceChf}
                  onChange={(event) => setFormState((s) => ({ ...s, basePriceChf: event.target.value }))}
                />
              </div>
              <Button className="w-full" onClick={onCreate}>
                Créer
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        {catalog?.pizzas.map((pizza) => (
          <Card key={pizza.id}>
            <CardContent className="flex items-center justify-between gap-3 pt-6">
              <div className="space-y-1">
                <p className="font-semibold">{pizza.name}</p>
                <p className="text-xs text-muted-foreground">{pizza.category.name}</p>
                <p className="text-sm">{formatChf(pizza.basePriceChf)}</p>
              </div>
              <Button variant="outline" size="sm" onClick={() => toggleAvailability(pizza.id, pizza.isAvailable)}>
                {pizza.isAvailable ? "Désactiver" : "Activer"}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
