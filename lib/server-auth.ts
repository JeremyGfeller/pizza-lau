import { UserRole } from "@prisma/client";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";

export async function requirePageUser(redirectTo?: string) {
  const user = await getCurrentUser();
  if (!user) {
    const next = redirectTo ? `?next=${encodeURIComponent(redirectTo)}` : "";
    redirect(`/login${next}`);
  }
  return user;
}

export async function requirePageRole(allowed: UserRole[], redirectTo = "/") {
  const user = await requirePageUser(redirectTo);
  if (!allowed.includes(user.role)) {
    redirect("/");
  }
  return user;
}
