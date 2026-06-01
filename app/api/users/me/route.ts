import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import prisma from "@/lib/prisma";
import { UserResponse } from "@/lib/validators/user";

export async function GET(req: NextRequest) {
  // console.log("x-user-id:", req.headers.get("x-user-id"))
  // console.log("x-user-role:", req.headers.get("x-user-role"))
  const session = await getSession();
  // console.log("session:", session)

  if (!session) {
    return NextResponse.json({ error: "Non autorizzato" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      roleName: true,
    },
  });

  if (!user) {
    return NextResponse.json({ error: "Utente non trovato" }, { status: 404 });
  }

  return NextResponse.json<UserResponse>({ user });

}