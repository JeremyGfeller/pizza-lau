"use client";

import Link from "next/link";
import { useState } from "react";
import { ShoppingBag, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { formatChf } from "@/lib/money";

type CartPayload = {
  id: string;
  itemCount: number;
  subtotalChf: number;
  items: Array<{
    id: string;
    quantity: number;
    unitPriceChf: number;
    lineTotalChf: number;
    pizza: { name: string };
    size: { name: string } | null;
    extras: Array<{ id: string; name: string; quantity: number }>;
  }>;
};

export function CartSheet({ initialCount }: { initialCount: number }) {
  const [open, setOpen] = useState(false);
  const [cart, setCart] = useState<CartPayload | null>(null);
  const [pending, setPending] = useState(false);

  async function loadCart() {
    setPending(true);
    try {
      const response = await fetch("/api/cart", { cache: "no-store" });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error ?? "Impossible de charger le panier");
      }
      setCart(data.cart);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erreur panier");
    } finally {
      setPending(false);
    }
  }

  async function changeQuantity(cartItemId: string, quantity: number) {
    setPending(true);
    try {
      const response = await fetch("/api/cart", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ cartItemId, quantity }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error ?? "Erreur de mise à jour");
      }
      setCart(data.cart);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erreur panier");
    } finally {
      setPending(false);
    }
  }

  async function removeItem(cartItemId: string) {
    setPending(true);
    try {
      const response = await fetch("/api/cart", {
        method: "DELETE",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ cartItemId }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error ?? "Erreur de suppression");
      }
      setCart(data.cart);
      toast.success("Article supprimé");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erreur panier");
    } finally {
      setPending(false);
    }
  }

  const badgeCount = cart?.itemCount ?? initialCount;

  return (
    <Sheet
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (next) {
          void loadCart();
        }
      }}
    >
      <SheetTrigger asChild>
        <Button variant="outline" className="relative">
          <ShoppingBag className="h-4 w-4" />
          Panier
          <span className="ml-2 rounded-full bg-primary px-2 py-0.5 text-xs text-primary-foreground">
            {badgeCount}
          </span>
        </Button>
      </SheetTrigger>
      <SheetContent className="overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Votre panier</SheetTitle>
          <SheetDescription>Modifiez rapidement votre commande avant paiement.</SheetDescription>
        </SheetHeader>
        <div className="mt-6 space-y-3">
          {pending && !cart ? <p className="text-sm text-muted-foreground">Chargement…</p> : null}
          {!pending && cart && cart.items.length === 0 ? (
            <p className="text-sm text-muted-foreground">Votre panier est vide.</p>
          ) : null}
          {cart?.items.map((item) => (
            <div key={item.id} className="rounded-2xl border p-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-medium">{item.pizza.name}</p>
                  {item.size ? <p className="text-xs text-muted-foreground">{item.size.name}</p> : null}
                  {item.extras.length ? (
                    <p className="text-xs text-muted-foreground">
                      + {item.extras.map((extra) => `${extra.name} x${extra.quantity}`).join(", ")}
                    </p>
                  ) : null}
                </div>
                <p className="text-sm font-semibold">{formatChf(item.lineTotalChf)}</p>
              </div>
              <div className="mt-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={pending || item.quantity <= 1}
                    onClick={() => changeQuantity(item.id, item.quantity - 1)}
                  >
                    -
                  </Button>
                  <span className="w-6 text-center text-sm">{item.quantity}</span>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={pending}
                    onClick={() => changeQuantity(item.id, item.quantity + 1)}
                  >
                    +
                  </Button>
                </div>
                <Button
                  size="icon"
                  variant="ghost"
                  disabled={pending}
                  onClick={() => removeItem(item.id)}
                  aria-label="Supprimer"
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            </div>
          ))}
        </div>
        <SheetFooter>
          <div className="w-full rounded-2xl border bg-muted/30 p-3 text-sm">
            <div className="flex items-center justify-between">
              <span>Sous-total</span>
              <span className="font-semibold">{formatChf(cart?.subtotalChf ?? 0)}</span>
            </div>
          </div>
          <Button asChild className="w-full" disabled={!cart?.items.length || pending}>
            <Link href="/checkout" onClick={() => setOpen(false)}>
              Passer au paiement
            </Link>
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
