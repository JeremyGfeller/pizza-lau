"use client";

import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { toast } from "sonner";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";

export function LogoutButton() {
  const router = useRouter();

  async function onLogout() {
    const response = await fetch("/api/auth/logout", { method: "POST" });
    if (!response.ok) {
      toast.error("Impossible de se déconnecter");
      return;
    }
    toast.success("Déconnexion réussie");
    router.push("/login");
    router.refresh();
  }

  return (
    <DropdownMenuItem onSelect={(event) => event.preventDefault()} onClick={onLogout}>
      <LogOut className="mr-2 h-4 w-4" />
      Déconnexion
    </DropdownMenuItem>
  );
}
