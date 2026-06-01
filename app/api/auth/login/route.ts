import { NextRequest, NextResponse } from "next/server";
import { signAccessToken, signRefreshToken } from "@/lib/auth/jwt";
import { setAuthCookies } from "@/lib/auth/cookies";
import bcrypt from "bcryptjs";
import prisma from "@/lib/prisma";
import { UserResponse } from "@/lib/validators/user";
import { LoginSchema } from "@/lib/validators/auth";

export async function POST(req: NextRequest) {
  const body = await req.json();

  const result = LoginSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json(
      { error: result.error.flatten() },
      { status: 400 }
    );
  }

  const { email, password } = result.data;

  const user = await prisma.user.findUnique({
    where: { email },
    include: { role: true },
  });

  if (!user || !(await bcrypt.compare(password, user.password))) {
    return NextResponse.json({ error: "Credenziali non valide" }, { status: 401 });
  }

  const accessToken = await signAccessToken({ userId: user.id, role: user.roleName });
  const refreshToken = await signRefreshToken(user.id);

  await prisma.refreshToken.create({
    data: {
      token: refreshToken,
      userId: user.id,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    },
  });

  await setAuthCookies(accessToken, refreshToken);

  return NextResponse.json<UserResponse>({
    user: {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      roleName: user.roleName,
    },
  });
}