import type { Metadata } from "next";
import { MobileNav } from "@/components/layout/mobile-nav";
import { SiteHeader } from "@/components/layout/site-header";
import { Providers } from "@/components/providers";
import "./globals.css";

export const metadata: Metadata = {
  title: "Pizza Lau | Livraison & retrait premium",
  description:
    "Commandez vos pizzas artisanales en quelques étapes, paiement Stripe sécurisé et suivi en temps réel.",
};

export const dynamic = "force-dynamic";

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr-CH">
      <body className="min-h-screen bg-background text-foreground">
        <Providers>
          <SiteHeader />
          <main className="flex-1">{children}</main>
          <MobileNav />
        </Providers>
      </body>
    </html>
  );
}
