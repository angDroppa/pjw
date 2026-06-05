import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import crypto from 'crypto'
import prisma from '@/lib/prisma'
import { RegisterSchema } from '@/lib/zodSchemas/auth.schema'

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
  const verificationToken = crypto.randomBytes(32).toString('hex')

  const user = await prisma.user.create({
    data: {
      firstName: parsed.data.firstName,
      lastName: parsed.data.lastName,
      email: parsed.data.email,
      password: hashedPassword,
      verificationToken,
      role: { connect: { role: 'CUSTOMER' } },
    },
  })

  // Simula invio email di attivazione
  console.log(`[SIMULA EMAIL] Attivazione account per ${user.email}`)
  console.log(`[SIMULA EMAIL] Link: /api/auth/verify?token=${verificationToken}`)

  return NextResponse.json({
    message: 'Utente registrato. Controlla la tua email per attivare l\'account.',
    verificationToken, // esposto solo in dev per test
  }, { status: 201 })
}
