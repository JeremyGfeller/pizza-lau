import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="page-shell flex min-h-[40vh] flex-col items-center justify-center gap-4 text-center">
      <h1 className="font-display text-3xl font-semibold">Page introuvable</h1>
      <p className="text-muted-foreground">La route demandée n&apos;existe pas.</p>
      <Button asChild>
        <Link href="/">Retour accueil</Link>
      </Button>
    </div>
  );
}
