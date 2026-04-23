import { NextRequest, NextResponse } from "next/server";
import { authCookieOptions, issueAuthSession, verifyPassword } from "@/lib/auth";
import { jsonError } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { loginSchema } from "@/lib/validators";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError(parsed.error.issues[0]?.message ?? "Payload invalide", 422);
  }

  const user = await prisma.user.findUnique({
    where: {
      username: parsed.data.username.toLowerCase(),
    },
  });
  if (!user) {
    return jsonError("Identifiants invalides", 401);
  }

  const isValid = await verifyPassword(parsed.data.password, user.passwordHash);
  if (!isValid) {
    return jsonError("Identifiants invalides", 401);
  }

  const { token, expiresAt } = await issueAuthSession(user);
  const response = NextResponse.json({
    user: {
      id: user.id,
      username: user.username,
      role: user.role,
      fullName: user.fullName,
    },
  });
  response.cookies.set("pizza_access_token", token, authCookieOptions(expiresAt));
  return response;
}
