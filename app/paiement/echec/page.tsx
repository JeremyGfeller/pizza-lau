import Link from "next/link";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function PaiementErreurPage({
  searchParams,
}: {
  searchParams: Promise<{ orderId?: string }>;
}) {
  const params = await searchParams;
  return (
    <div className="page-shell flex items-center justify-center">
      <Card className="w-full max-w-xl text-center">
        <CardHeader>
          <AlertTriangle className="mx-auto h-12 w-12 text-destructive" />
          <CardTitle>Paiement interrompu</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm text-muted-foreground">
          <p>Votre paiement n&apos;a pas été validé. Vous pouvez réessayer en toute sécurité.</p>
          <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Button asChild>
              <Link href="/checkout">Revenir au checkout</Link>
            </Button>
            {params.orderId ? (
              <Button asChild variant="outline">
                <Link href={`/commande/${params.orderId}`}>Voir la commande</Link>
              </Button>
            ) : null}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
