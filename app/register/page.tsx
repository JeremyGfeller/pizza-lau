import Link from "next/link";
import { redirect } from "next/navigation";
import { RegisterForm } from "@/components/auth/register-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getCurrentUser } from "@/lib/auth";

export default async function RegisterPage() {
  const user = await getCurrentUser();
  if (user) {
    redirect("/");
  }

  return (
    <div className="page-shell flex items-center justify-center">
      <Card className="w-full max-w-xl">
        <CardHeader>
          <CardTitle>Créer un compte</CardTitle>
          <CardDescription>
            Compte client sécurisé avec JWT + mot de passe hashé bcrypt.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <RegisterForm />
          <p className="text-sm text-muted-foreground">
            Déjà inscrit ?{" "}
            <Link href="/login" className="font-semibold text-primary">
              Se connecter
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
