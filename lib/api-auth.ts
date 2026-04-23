import { UserRole } from "@prisma/client";
import { NextRequest } from "next/server";
import { getAuthUserFromRequest } from "@/lib/auth";
import { jsonError } from "@/lib/http";

export async function requireApiUser(request: NextRequest) {
  const user = await getAuthUserFromRequest(request);
  if (!user) {
    return { user: null, error: jsonError("Authentification requise", 401) };
  }
  return { user, error: null };
}

export function requireApiRole(role: UserRole, allowed: UserRole[]) {
  if (!allowed.includes(role)) {
    return jsonError("Accès interdit", 403);
  }
  return null;
}
