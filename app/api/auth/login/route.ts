import { NextResponse } from 'next/server'
import { LoginSchema } from '@/lib/zodSchemas/auth.schema'
import { signAccessToken, signRefreshToken } from '@/lib/jwt'
import bcrypt from 'bcryptjs'
import prisma from '@/lib/prisma'

export async function POST(req: Request) {
  const body = await req.json()

  const parsed = LoginSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { errors: parsed.error.flatten() },
      { status: 400 }
    )
  }

  const user = await prisma.user.findUnique({
    where: { email: parsed.data.email },
    include: {
      role: true,
    },
  })

  if (!user) {
    return NextResponse.json(
      { error: 'Credenziali non valide' },
      { status: 401 }
    )
  }

  const valid = await bcrypt.compare(parsed.data.password, user.password)
  if (!valid) {
    return NextResponse.json(
      { error: 'Credenziali non valide' },
      { status: 401 }
    )
  }

  const accessToken = await signAccessToken({
    id: user.id,
    email: user.email,
  })

  const refreshToken = await signRefreshToken({
    id: user.id,
    email: user.email,
  })

  await prisma.refreshToken.create({
    data: {
      token: refreshToken,
      userId: user.id,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    },
  })

  const userResponse = {
    id: user.id,
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    roleName: user.role.role,
  }

  return NextResponse.json({
    accessToken,
    refreshToken,
    user: userResponse,
  })
}