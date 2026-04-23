import bcrypt from "bcrypt";
import jwt, { type JwtPayload, type Secret, type SignOptions } from "jsonwebtoken";
import { randomUUID } from "node:crypto";
import { type User, UserRole } from "@prisma/client";
import { cookies } from "next/headers";
import { NextRequest } from "next/server";
import { env } from "@/lib/env";
import { prisma } from "@/lib/prisma";

export const AUTH_COOKIE_NAME = "pizza_access_token";

export type AccessTokenPayload = JwtPayload & {
  sub: string;
  username: string;
  role: UserRole;
  sid: string;
};

export type AuthUser = {
  id: string;
  username: string;
  role: UserRole;
  fullName: string;
};

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}

function signAccessToken(payload: AccessTokenPayload) {
  return jwt.sign(payload as object, env.jwtAccessSecret as Secret, {
    expiresIn: env.jwtAccessTtl as SignOptions["expiresIn"],
  });
}

function verifyAccessToken(token: string) {
  try {
    return jwt.verify(token, env.jwtAccessSecret) as AccessTokenPayload;
  } catch {
    return null;
  }
}

function parseJwtExpiry(payload: AccessTokenPayload) {
  if (!payload.exp) {
    return new Date(Date.now() + 2 * 60 * 60 * 1000);
  }
  return new Date(payload.exp * 1000);
}

async function createSessionAndToken(user: User) {
  const sid = randomUUID();
  const token = signAccessToken({
    sub: user.id,
    username: user.username,
    role: user.role,
    sid,
  });
  const payload = verifyAccessToken(token);
  if (!payload) {
    throw new Error("Unable to create session token");
  }

  await prisma.session.create({
    data: {
      userId: user.id,
      tokenId: sid,
      expiresAt: parseJwtExpiry(payload),
    },
  });

  return token;
}

export function authCookieOptions(expiresAt?: Date) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    expires: expiresAt,
  };
}

export async function issueAuthSession(user: User) {
  const token = await createSessionAndToken(user);
  const payload = verifyAccessToken(token);
  if (!payload) {
    throw new Error("Unable to parse auth token");
  }
  return {
    token,
    expiresAt: parseJwtExpiry(payload),
  };
}

export async function setAuthCookie(token: string) {
  const payload = verifyAccessToken(token);
  const expiresAt = payload ? parseJwtExpiry(payload) : undefined;
  const cookieStore = await cookies();
  cookieStore.set(AUTH_COOKIE_NAME, token, authCookieOptions(expiresAt));
}

export async function clearAuthCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(AUTH_COOKIE_NAME);
}

function tokenFromRequest(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (authHeader?.startsWith("Bearer ")) {
    return authHeader.slice("Bearer ".length);
  }
  return request.cookies.get(AUTH_COOKIE_NAME)?.value ?? null;
}

async function resolveAuthFromToken(token: string | null): Promise<AuthUser | null> {
  if (!token) {
    return null;
  }

  const payload = verifyAccessToken(token);
  if (!payload?.sub || !payload.sid) {
    return null;
  }

  const session = await prisma.session.findUnique({
    where: { tokenId: payload.sid },
    include: { user: true },
  });

  if (!session || session.revokedAt || session.expiresAt < new Date()) {
    return null;
  }

  return {
    id: session.user.id,
    username: session.user.username,
    role: session.user.role,
    fullName: session.user.fullName,
  };
}

export async function getAuthUserFromRequest(request: NextRequest) {
  return resolveAuthFromToken(tokenFromRequest(request));
}

export async function getCurrentUser() {
  const cookieStore = await cookies();
  return resolveAuthFromToken(cookieStore.get(AUTH_COOKIE_NAME)?.value ?? null);
}

export async function revokeSessionFromRequest(request: NextRequest) {
  const token = tokenFromRequest(request);
  if (!token) {
    return;
  }
  const payload = verifyAccessToken(token);
  if (!payload?.sid) {
    return;
  }
  await prisma.session.updateMany({
    where: { tokenId: payload.sid, revokedAt: null },
    data: { revokedAt: new Date() },
  });
}

export function assertRole(user: AuthUser | null, roles: UserRole[]) {
  return !!user && roles.includes(user.role);
}
