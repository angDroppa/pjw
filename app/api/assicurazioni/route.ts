import prisma from '@/lib/prisma'
import { NextResponse } from 'next/server'
import { CreateAssicurazioneSchema } from '@/lib/schemas/assicurazione.schema'
import { requireAuth } from '@/lib/auth-helper'

export async function GET() {
  const assicurazioni = await prisma.assicurazione.findMany()
  return NextResponse.json(assicurazioni)
}

export async function POST(req: Request) {
  const user = await requireAuth(req)
  if (!user) return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })
  if (user.roleName !== 'ADMIN') return NextResponse.json({ error: 'Accesso negato' }, { status: 403 })

  const body = await req.json()
  const parsed = CreateAssicurazioneSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ errors: parsed.error.flatten() }, { status: 400 })

  const assicurazione = await prisma.assicurazione.create({ data: parsed.data })
  return NextResponse.json(assicurazione, { status: 201 })
}