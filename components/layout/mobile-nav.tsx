"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { Home, ShoppingBag, UserCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

export function MobileNav() {
  const pathname = usePathname();
  const [isLogged, setIsLogged] = useState(false);

  useEffect(() => {
    let mounted = true;
    fetch("/api/auth/me", { cache: "no-store" })
      .then((response) => {
        if (!mounted) {
          return;
        }
        setIsLogged(response.ok);
      })
      .catch(() => {
        if (mounted) {
          setIsLogged(false);
        }
      });
    return () => {
      mounted = false;
    };
  }, [pathname]);

  if (!isLogged) {
    return null;
  }

  const items = [
    { href: "/", label: "Accueil", icon: Home },
    { href: "/boutique", label: "Boutique", icon: ShoppingBag },
    { href: "/compte", label: "Compte", icon: UserCircle2 },
  ];

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 px-4 py-2 backdrop-blur md:hidden">
      <div className="mx-auto grid max-w-md grid-cols-3 gap-2">
        {items.map((item) => {
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center rounded-xl py-2 text-xs",
                active ? "bg-primary/10 text-primary" : "text-muted-foreground",
              )}
            >
              <Icon className="mb-1 h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
