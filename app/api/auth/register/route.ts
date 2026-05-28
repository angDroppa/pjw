import { NextResponse } from 'next/server'
import { RegisterSchema } from '@/lib/schemas/auth.schema'
import bcrypt from 'bcryptjs'
import prisma from '@/lib/prisma'

export async function POST(req: Request) {
  const body = await req.json()

  const parsed = RegisterSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ errors: parsed.error.flatten() }, { status: 400 })
  }

  const existing = await prisma.user.findUnique({
    where: { email: parsed.data.email },
  })

  if (existing) {
    return NextResponse.json({ error: 'Email già esistente' }, { status: 409 })
  }

  const hashedPassword = await bcrypt.hash(parsed.data.password, 10)

  const user = await prisma.user.create({
    data: {
      firstName: parsed.data.firstName,
      lastName: parsed.data.lastName,
      email: parsed.data.email,
      password: hashedPassword,
      role: { connect: { role: 'USER' } },
    },
  })

  return NextResponse.json({ message: 'Utente registrato' }, { status: 201 })
}