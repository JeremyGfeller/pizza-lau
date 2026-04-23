import { CheckoutForm } from "@/components/checkout/checkout-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requirePageUser } from "@/lib/server-auth";

export default async function CheckoutPage() {
  await requirePageUser("/checkout");

  return (
    <div className="page-shell space-y-6">
      <div>
        <h1 className="font-display text-3xl font-semibold">Checkout</h1>
        <p className="text-muted-foreground">
          Paiement Stripe sécurisé, mode livraison ou retrait cuisine.
        </p>
      </div>
      <CheckoutForm />
      <Card>
        <CardHeader>
          <CardTitle>Sécurité</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Paiement géré via Stripe, token JWT stocké en cookie httpOnly et validation serveur stricte.
        </CardContent>
      </Card>
    </div>
  );
}
