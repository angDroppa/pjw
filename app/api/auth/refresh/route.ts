import { NextRequest, NextResponse } from "next/server";
import { verifyRefreshToken, signAccessToken, signRefreshToken } from "@/lib/auth/jwt";
import { setAuthCookies, getRefreshToken } from "@/lib/auth/cookies";
import prisma from "@/lib/prisma";

export async function POST(req: NextRequest) {
  // In middleware usiamo req.cookies direttamente perché non siamo in un Server Component
  const refreshToken = req.cookies.get("refresh_token")?.value;

  if (!refreshToken) {
    return NextResponse.json({ error: "Refresh token mancante" }, { status: 401 });
  }

  const payload = await verifyRefreshToken(refreshToken);
  if (!payload) {
    return NextResponse.json({ error: "Refresh token non valido" }, { status: 401 });
  }

  // Verifica che esista nel DB e non sia scaduto
  const storedToken = await prisma.refreshToken.findUnique({
    where: { token: refreshToken },
    include: { user: true },
  });

  if (!storedToken || storedToken.expiresAt < new Date()) {
    return NextResponse.json({ error: "Refresh token scaduto" }, { status: 401 });
  }

  // Ruota il refresh token (refresh token rotation)
  await prisma.refreshToken.delete({ where: { token: refreshToken } });

  const newAccessToken = await signAccessToken({
    userId: storedToken.user.id,
    role: storedToken.user.roleName,
  });
  const newRefreshToken = await signRefreshToken(storedToken.user.id);

  await prisma.refreshToken.create({
    data: {
      token: newRefreshToken,
      userId: storedToken.user.id,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    },
  });

  await setAuthCookies(newAccessToken, newRefreshToken);

  return NextResponse.json({ ok: true });
}