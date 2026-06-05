import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import prisma from '@/lib/prisma'
import { requireAuth } from '@/lib/auth-helper'

export async function GET(req: Request) {
  const user = await requireAuth(req)
  if (!user) return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })

  const users = await prisma.user.findMany({
    select: { id: true, firstName: true, lastName: true, email: true, roleName: true, verified: true },
  })

  return NextResponse.json(users)
}

export async function POST(req: Request) {
  const authUser = await requireAuth(req)
  if (!authUser) return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })

  const body = await req.json()

  const existing = await prisma.user.findUnique({ where: { email: body.email } })
  if (existing) return NextResponse.json({ error: 'Email già esistente' }, { status: 409 })

  const hashedPassword = await bcrypt.hash(body.password, 10)

  const user = await prisma.user.create({
    data: {
      firstName: body.firstName,
      lastName: body.lastName,
      email: body.email,
      password: hashedPassword,
      role: { connect: { role: body.roleName ?? 'CUSTOMER' } },
    },
    select: { id: true, firstName: true, lastName: true, email: true, roleName: true },
  })

  return NextResponse.json(user, { status: 201 })
}
