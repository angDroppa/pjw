import prisma from '@/lib/prisma'
import { NextResponse } from 'next/server'
import { CreateAccessorioSchema } from '@/lib/zodSchemas/accessorio'
import { requireAuth } from '@/lib/auth-helper'

export async function GET() {
  const accessori = await prisma.accessorio.findMany()
  return NextResponse.json(accessori)
}

export async function POST(req: Request) {
  const user = await requireAuth(req)
  if (!user) return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })
  if (user.roleName !== 'ADMIN') return NextResponse.json({ error: 'Accesso negato' }, { status: 403 })

  const body = await req.json()
  const parsed = CreateAccessorioSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ errors: parsed.error.flatten() }, { status: 400 })

  const accessorio = await prisma.accessorio.create({ data: parsed.data })
  return NextResponse.json(accessorio, { status: 201 })
}
