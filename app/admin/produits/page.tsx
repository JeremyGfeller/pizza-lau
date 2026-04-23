import { ProductsBoard } from "@/components/admin/products-board";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function AdminProduitsPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Gestion produits</CardTitle>
      </CardHeader>
      <CardContent>
        <ProductsBoard />
      </CardContent>
    </Card>
  );
}
