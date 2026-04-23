import { OrdersBoard } from "@/components/admin/orders-board";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function AdminOrdersPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Gestion des commandes</CardTitle>
      </CardHeader>
      <CardContent>
        <OrdersBoard />
      </CardContent>
    </Card>
  );
}
