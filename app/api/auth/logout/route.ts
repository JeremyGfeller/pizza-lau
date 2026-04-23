import { NextRequest, NextResponse } from "next/server";
import { AUTH_COOKIE_NAME, revokeSessionFromRequest } from "@/lib/auth";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  await revokeSessionFromRequest(request);
  const response = NextResponse.json({ ok: true });
  response.cookies.delete(AUTH_COOKIE_NAME);
  return response;
}
