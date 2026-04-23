"use client";

import { UserRole } from "@prisma/client";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

type UserRow = {
  id: string;
  username: string;
  fullName: string;
  email: string | null;
  role: UserRole;
  _count: { orders: number };
};

const roles = [UserRole.CUSTOMER, UserRole.STAFF, UserRole.ADMIN];

export function UsersBoard() {
  const [users, setUsers] = useState<UserRow[]>([]);

  async function loadUsers() {
    const response = await fetch("/api/admin/users", { cache: "no-store" });
    const data = await response.json();
    if (!response.ok) {
      toast.error(data.error ?? "Impossible de charger les utilisateurs");
      return;
    }
    setUsers(data.users);
  }

  useEffect(() => {
    let mounted = true;
    fetch("/api/admin/users", { cache: "no-store" })
      .then((response) => response.json())
      .then((data) => {
        if (!mounted) {
          return;
        }
        setUsers(data.users);
      })
      .catch(() => {
        if (mounted) {
          toast.error("Impossible de charger les utilisateurs");
        }
      });
    return () => {
      mounted = false;
    };
  }, []);

  async function updateRole(userId: string, role: UserRole) {
    const response = await fetch("/api/admin/users", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ userId, role }),
    });
    const data = await response.json();
    if (!response.ok) {
      toast.error(data.error ?? "Update rôle impossible");
      return;
    }
    toast.success("Rôle mis à jour");
    await loadUsers();
  }

  return (
    <div className="grid gap-3">
      {users.map((user) => (
        <Card key={user.id}>
          <CardContent className="flex flex-col gap-3 pt-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-semibold">{user.fullName}</p>
              <p className="text-xs text-muted-foreground">
                @{user.username} • {user.email ?? "sans email"} • {user._count.orders} commande(s)
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Badge variant="outline">{user.role.toLowerCase()}</Badge>
              <select
                className="h-9 rounded-xl border bg-background px-2 text-sm"
                value={user.role}
                onChange={(event) => updateRole(user.id, event.target.value as UserRole)}
              >
                {roles.map((role) => (
                  <option key={role} value={role}>
                    {role}
                  </option>
                ))}
              </select>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
