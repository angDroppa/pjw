import prisma from '@/lib/prisma'
import { NextResponse } from 'next/server'
import { CreateAssicurazioneSchema } from '@/lib/zodSchemas/assicurazione'
import { requireAuth } from '@/lib/auth-helper'

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const assicurazione = await prisma.assicurazione.findUnique({ where: { id: Number(id) } })
  if (!assicurazione) return NextResponse.json({ error: 'Assicurazione non trovata' }, { status: 404 })
  return NextResponse.json(assicurazione)
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const user = await requireAuth(req)
  if (!user) return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })
  if (user.roleName !== 'ADMIN') return NextResponse.json({ error: 'Accesso negato' }, { status: 403 })

  const assicurazione = await prisma.assicurazione.findUnique({ where: { id: Number(id) } })
  if (!assicurazione) return NextResponse.json({ error: 'Assicurazione non trovata' }, { status: 404 })

  const body = await req.json()
  const parsed = CreateAssicurazioneSchema.partial().safeParse(body)
  if (!parsed.success) return NextResponse.json({ errors: parsed.error.flatten() }, { status: 400 })

  const updated = await prisma.assicurazione.update({ where: { id: Number(id) }, data: parsed.data })
  return NextResponse.json(updated)
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const user = await requireAuth(req)
  if (!user) return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })
  if (user.roleName !== 'ADMIN') return NextResponse.json({ error: 'Accesso negato' }, { status: 403 })

  const assicurazione = await prisma.assicurazione.findUnique({ where: { id: Number(id) } })
  if (!assicurazione) return NextResponse.json({ error: 'Assicurazione non trovata' }, { status: 404 })

  await prisma.assicurazione.delete({ where: { id: Number(id) } })
  return NextResponse.json({ message: 'Assicurazione eliminata' })
}
