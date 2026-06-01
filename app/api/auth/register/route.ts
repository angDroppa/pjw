import { NextRequest, NextResponse } from "next/server";
import { RegisterSchema } from "@/lib/validators/auth";
import bcrypt from "bcryptjs";
import prisma from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const body = await req.json();

  const result = RegisterSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json(
      { error: result.error.flatten() },
      { status: 400 }
    );
  }

  const { firstName, lastName, email, password } = result.data;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json({ error: "Email già in uso" }, { status: 409 });
  }

  const hashed = await bcrypt.hash(password, 10);

  const user = await prisma.user.create({
    data: {
      firstName,
      lastName,
      email,
      password: hashed,
    },
  });

  return new NextResponse(null, { status: 201 });
}