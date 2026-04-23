import Link from "next/link";
import { UserRole } from "@prisma/client";
import { UserCircle2 } from "lucide-react";
import { LogoutButton } from "@/components/auth/logout-button";
import { CartSheet } from "@/components/cart/cart-sheet";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function SiteHeader() {
  const user = await getCurrentUser();
  const cartCount = user
    ? await prisma.cartItem
        .aggregate({
          where: {
            cart: { userId: user.id },
          },
          _sum: {
            quantity: true,
          },
        })
        .then((result) => result._sum.quantity ?? 0)
    : 0;

  return (
    <header className="sticky top-0 z-40 border-b border-border/70 bg-background/90 backdrop-blur">
      <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between gap-3 px-4 sm:px-6">
        <Link href="/" className="font-display text-xl font-bold tracking-tight">
          Pizza Lau
        </Link>
        <nav className="hidden items-center gap-4 text-sm md:flex">
          <Link href="/boutique" className="hover:text-primary">
            Boutique
          </Link>
          <Link href="/compte" className="hover:text-primary">
            Mes commandes
          </Link>
          {user?.role !== UserRole.CUSTOMER ? (
            <Link href="/admin" className="hover:text-primary">
              Dashboard admin
            </Link>
          ) : null}
        </nav>

        <div className="flex items-center gap-2">
          {user ? <CartSheet initialCount={cartCount} /> : null}
          {!user ? (
            <>
              <Button variant="ghost" asChild className="hidden sm:inline-flex">
                <Link href="/register">Créer un compte</Link>
              </Button>
              <Button asChild>
                <Link href="/login">Connexion</Link>
              </Button>
            </>
          ) : (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline">
                  <UserCircle2 className="mr-2 h-4 w-4" />
                  {user.username}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52">
                <DropdownMenuLabel>
                  <div className="leading-tight">
                    <p>{user.fullName}</p>
                    <p className="text-xs text-muted-foreground">{user.role.toLowerCase()}</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/compte">Mon espace</Link>
                </DropdownMenuItem>
                {user.role !== UserRole.CUSTOMER ? (
                  <DropdownMenuItem asChild>
                    <Link href="/admin">Dashboard admin</Link>
                  </DropdownMenuItem>
                ) : null}
                <DropdownMenuSeparator />
                <LogoutButton />
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>
    </header>
  );
}
