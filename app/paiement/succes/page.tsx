import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { prisma } from "@/lib/prisma";

export default async function PaiementSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ session_id?: string }>;
}) {
  const params = await searchParams;
  const order = params.session_id
    ? await prisma.order.findUnique({
        where: { stripeSessionId: params.session_id },
      })
    : null;

  return (
    <div className="page-shell flex items-center justify-center">
      <Card className="w-full max-w-xl text-center">
        <CardHeader>
          <CheckCircle2 className="mx-auto h-12 w-12 text-primary" />
          <CardTitle>Paiement confirmé</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm text-muted-foreground">
          <p>
            Merci pour votre commande. {order ? `Numéro: #${order.orderNumber}.` : ""} La cuisine
            la prend en charge rapidement.
          </p>
          <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
            {order ? (
              <Button asChild>
                <Link href={`/commande/${order.id}`}>Suivre ma commande</Link>
              </Button>
            ) : null}
            <Button asChild variant="outline">
              <Link href="/boutique">Commander à nouveau</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
