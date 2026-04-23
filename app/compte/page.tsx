import Link from "next/link";
import { ORDER_STATUS_LABEL } from "@/lib/order-status";
import { formatChf, fromDecimal } from "@/lib/money";
import { prisma } from "@/lib/prisma";
import { requirePageUser } from "@/lib/server-auth";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default async function ComptePage() {
  const user = await requirePageUser("/compte");

  const [profile, orders] = await Promise.all([
    prisma.user.findUnique({
      where: { id: user.id },
      select: {
        fullName: true,
        username: true,
        email: true,
        phone: true,
        role: true,
      },
    }),
    prisma.order.findMany({
      where: { userId: user.id },
      include: {
        items: true,
      },
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
  ]);

  return (
    <div className="page-shell space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Espace client</CardTitle>
          <CardDescription>Votre profil et vos commandes.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-2 text-sm sm:grid-cols-2">
          <p>
            <span className="text-muted-foreground">Nom:</span> {profile?.fullName}
          </p>
          <p>
            <span className="text-muted-foreground">Username:</span> {profile?.username}
          </p>
          <p>
            <span className="text-muted-foreground">Email:</span> {profile?.email ?? "-"}
          </p>
          <p>
            <span className="text-muted-foreground">Téléphone:</span> {profile?.phone ?? "-"}
          </p>
        </CardContent>
      </Card>

      <section className="space-y-3">
        <h2 className="font-display text-2xl font-semibold">Historique des commandes</h2>
        {orders.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-sm text-muted-foreground">
              Aucune commande pour le moment.
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {orders.map((order) => (
              <Card key={order.id}>
                <CardContent className="flex flex-col gap-3 pt-6 sm:flex-row sm:items-center sm:justify-between">
                  <div className="space-y-1 text-sm">
                    <p className="font-semibold">Commande #{order.orderNumber}</p>
                    <p className="text-muted-foreground">
                      {order.items.length} article(s) • {formatChf(fromDecimal(order.totalChf))}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge>{ORDER_STATUS_LABEL[order.status]}</Badge>
                    <Button asChild variant="outline" size="sm">
                      <Link href={`/commande/${order.id}`}>Suivi</Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
