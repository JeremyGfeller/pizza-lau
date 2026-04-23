import { NextRequest, NextResponse } from "next/server";
import { authCookieOptions, issueAuthSession, hashPassword } from "@/lib/auth";
import { jsonError } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { registerSchema } from "@/lib/validators";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const parsed = registerSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError(parsed.error.issues[0]?.message ?? "Payload invalide", 422);
  }

  const username = parsed.data.username.toLowerCase();
  const exists = await prisma.user.findUnique({ where: { username } });
  if (exists) {
    return jsonError("Ce username est déjà utilisé", 409);
  }

  const user = await prisma.user.create({
    data: {
      username,
      fullName: parsed.data.fullName,
      email: parsed.data.email || null,
      phone: parsed.data.phone || null,
      passwordHash: await hashPassword(parsed.data.password),
    },
  });

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
