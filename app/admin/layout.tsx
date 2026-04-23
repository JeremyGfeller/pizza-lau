import Link from "next/link";
import { UserRole } from "@prisma/client";
import { Badge } from "@/components/ui/badge";
import { requirePageRole } from "@/lib/server-auth";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requirePageRole([UserRole.ADMIN, UserRole.STAFF], "/admin");

  const links = [
    { href: "/admin", label: "Overview" },
    { href: "/admin/commandes", label: "Commandes" },
    { href: "/admin/produits", label: "Produits" },
    { href: "/admin/utilisateurs", label: "Utilisateurs" },
    { href: "/admin/reporting", label: "Reporting" },
  ];

  return (
    <div className="page-shell space-y-5">
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="font-display text-3xl font-semibold">Dashboard admin</h1>
        <Badge>Ops cuisine & livraison</Badge>
      </div>
      <nav className="flex flex-wrap gap-2">
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="rounded-full border px-3 py-1.5 text-sm hover:border-primary hover:text-primary"
          >
            {link.label}
          </Link>
        ))}
      </nav>
      {children}
    </div>
  );
}
