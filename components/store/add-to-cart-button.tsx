"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

type AddToCartButtonProps = {
  pizzaId: string;
  sizeOptionId?: string;
  className?: string;
};

export function AddToCartButton({ pizzaId, sizeOptionId, className }: AddToCartButtonProps) {
  const [loading, setLoading] = useState(false);

  async function onAdd() {
    setLoading(true);
    try {
      const response = await fetch("/api/cart", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          pizzaId,
          sizeOptionId,
          quantity: 1,
          extras: [],
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        if (response.status === 401) {
          toast.error("Connectez-vous pour ajouter au panier");
          return;
        }
        throw new Error(data.error ?? "Erreur panier");
      }
      toast.success("Pizza ajoutée au panier");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erreur panier");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button onClick={onAdd} disabled={loading} className={className}>
      <Plus className="mr-2 h-4 w-4" />
      {loading ? "Ajout..." : "Ajouter"}
    </Button>
  );
}
