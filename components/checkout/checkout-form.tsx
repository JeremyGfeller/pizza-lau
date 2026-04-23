"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { PickupMode } from "@prisma/client";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { formatChf } from "@/lib/money";
import { checkoutSchema } from "@/lib/validators";

type CheckoutPayload = z.infer<typeof checkoutSchema>;

type CartPayload = {
  itemCount: number;
  subtotalChf: number;
};

export function CheckoutForm() {
  const router = useRouter();
  const [cart, setCart] = useState<CartPayload | null>(null);
  const [zoneQuote, setZoneQuote] = useState<number>(0);

  const form = useForm<CheckoutPayload>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      pickupMode: PickupMode.PICKUP,
      customerName: "",
      customerPhone: "",
      customerEmail: "",
      customerNotes: "",
      deliveryAddress: {
        street: "",
        postalCode: "",
        city: "",
        canton: "",
      },
    },
  });

  useEffect(() => {
    fetch("/api/cart", { cache: "no-store" })
      .then((response) => response.json())
      .then((data) => setCart(data.cart))
      .catch(() => setCart(null));
  }, []);

  const pickupMode = form.watch("pickupMode");
  const postalCode = form.watch("deliveryAddress.postalCode");

  useEffect(() => {
    if (pickupMode !== PickupMode.DELIVERY || postalCode?.length !== 4) {
      setZoneQuote(0);
      return;
    }
    fetch(`/api/delivery-zones/quote?postalCode=${postalCode}`)
      .then((response) => response.json())
      .then((data) => setZoneQuote(data.deliveryFeeChf ?? 0))
      .catch(() => setZoneQuote(0));
  }, [pickupMode, postalCode]);

  const taxAmount = useMemo(() => {
    const subtotal = cart?.subtotalChf ?? 0;
    return Math.round((subtotal + zoneQuote) * 8.1) / 100;
  }, [cart?.subtotalChf, zoneQuote]);

  const total = (cart?.subtotalChf ?? 0) + zoneQuote + taxAmount;

  async function onSubmit(values: CheckoutPayload) {
    const response = await fetch("/api/checkout/session", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(values),
    });
    const data = await response.json();
    if (!response.ok) {
      toast.error(data.error ?? "Paiement indisponible");
      return;
    }
    if (data.checkoutUrl) {
      window.location.href = data.checkoutUrl;
      return;
    }
    router.push(`/commande/${data.orderId}`);
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
      <Card>
        <CardHeader>
          <CardTitle>Informations de commande</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form className="space-y-5" onSubmit={form.handleSubmit(onSubmit)}>
              <FormField
                control={form.control}
                name="pickupMode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Mode de récupération</FormLabel>
                    <Tabs
                      value={field.value}
                      onValueChange={(value) => field.onChange(value as PickupMode)}
                    >
                      <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value={PickupMode.PICKUP}>Retrait cuisine</TabsTrigger>
                        <TabsTrigger value={PickupMode.DELIVERY}>Livraison</TabsTrigger>
                      </TabsList>
                    </Tabs>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="customerName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nom complet</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="customerPhone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Téléphone</FormLabel>
                      <FormControl>
                        <Input placeholder="+41791234567" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="customerEmail"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="vous@exemple.ch" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {pickupMode === PickupMode.DELIVERY ? (
                <div className="rounded-2xl border bg-muted/20 p-4">
                  <p className="mb-4 text-sm font-semibold">Adresse de livraison</p>
                  <div className="space-y-4">
                    <FormField
                      control={form.control}
                      name="deliveryAddress.street"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Rue et numéro</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="grid gap-4 sm:grid-cols-3">
                      <FormField
                        control={form.control}
                        name="deliveryAddress.postalCode"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>NPA</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="deliveryAddress.city"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Ville</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="deliveryAddress.canton"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Canton</FormLabel>
                            <FormControl>
                              <Input placeholder="VD" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                </div>
              ) : null}

              <FormField
                control={form.control}
                name="customerNotes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Remarque</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Sans oignons, sonnette B12..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button className="w-full" disabled={form.formState.isSubmitting || !cart?.itemCount}>
                {form.formState.isSubmitting ? "Redirection Stripe..." : "Payer avec Stripe"}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      <Card className="h-fit">
        <CardHeader>
          <CardTitle>Récapitulatif</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="flex justify-between">
            <span>Articles</span>
            <span>{cart?.itemCount ?? 0}</span>
          </div>
          <div className="flex justify-between">
            <span>Sous-total</span>
            <span>{formatChf(cart?.subtotalChf ?? 0)}</span>
          </div>
          <div className="flex justify-between">
            <span>Livraison</span>
            <span>{formatChf(zoneQuote)}</span>
          </div>
          <div className="flex justify-between">
            <span>TVA estimée</span>
            <span>{formatChf(taxAmount)}</span>
          </div>
          <div className="flex justify-between border-t pt-3 text-base font-semibold">
            <span>Total</span>
            <span>{formatChf(total)}</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
