import { NextRequest, NextResponse } from "next/server";
import { verifyRefreshToken, signAccessToken, signRefreshToken } from "@/lib/auth/jwt";
import prisma from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const refreshToken = req.cookies.get("refresh_token")?.value;

  if (!refreshToken) {
    return NextResponse.json({ error: "Refresh token mancante" }, { status: 401 });
  }

  const payload = await verifyRefreshToken(refreshToken);
  if (!payload) {
    return NextResponse.json({ error: "Refresh token non valido" }, { status: 401 });
  }

  const storedToken = await prisma.refreshToken.findUnique({
    where: { token: refreshToken },
    include: { user: true },
  });

  if (!storedToken || storedToken.expiresAt < new Date()) {
    return NextResponse.json({ error: "Refresh token scaduto" }, { status: 401 });
  }

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

  const isProd = process.env.NODE_ENV === "production";
  const cookieOptions = [
    `access_token=${newAccessToken}; HttpOnly; Path=/; Max-Age=${60 * 15}; SameSite=${isProd ? "None" : "Lax"}${isProd ? "; Secure" : ""}`,
    `refresh_token=${newRefreshToken}; HttpOnly; Path=/; Max-Age=${60 * 60 * 24 * 7}; SameSite=${isProd ? "None" : "Lax"}${isProd ? "; Secure" : ""}`,
  ];

  const response = NextResponse.json({ ok: true });
  cookieOptions.forEach(cookie => response.headers.append("Set-Cookie", cookie));
  return response;
}