import { NextRequest, NextResponse } from "next/server";
import { clearAuthCookies } from "@/lib/auth/cookies";
import prisma from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const refreshToken = req.cookies.get("refresh_token")?.value;

  if (refreshToken) {
    // Cancella dal DB così il token è immediatamente invalidato
    await prisma.refreshToken.deleteMany({ where: { token: refreshToken } });
  }

  await clearAuthCookies();

  return NextResponse.json({ ok: true });
}