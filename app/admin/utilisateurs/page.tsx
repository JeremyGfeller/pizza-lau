import { UsersBoard } from "@/components/admin/users-board";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function AdminUtilisateursPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Gestion utilisateurs & rôles</CardTitle>
      </CardHeader>
      <CardContent>
        <UsersBoard />
      </CardContent>
    </Card>
  );
}
