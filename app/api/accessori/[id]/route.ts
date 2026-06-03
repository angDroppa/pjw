import prisma from '@/lib/prisma'
import { NextResponse } from 'next/server'
import { CreateAccessorioSchema } from '@/lib/schemas/accessorio.schema'
import { requireAuth } from '@/lib/auth-helper'

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const accessorio = await prisma.accessorio.findUnique({ where: { id: Number(id) } })
  if (!accessorio) return NextResponse.json({ error: 'Accessorio non trovato' }, { status: 404 })
  return NextResponse.json(accessorio)
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const user = await requireAuth(req)
  if (!user) return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })
  if (user.roleName !== 'ADMIN') return NextResponse.json({ error: 'Accesso negato' }, { status: 403 })

  const accessorio = await prisma.accessorio.findUnique({ where: { id: Number(id) } })
  if (!accessorio) return NextResponse.json({ error: 'Accessorio non trovato' }, { status: 404 })

  const body = await req.json()
  const parsed = CreateAccessorioSchema.partial().safeParse(body)
  if (!parsed.success) return NextResponse.json({ errors: parsed.error.flatten() }, { status: 400 })

  const updated = await prisma.accessorio.update({ where: { id: Number(id) }, data: parsed.data })
  return NextResponse.json(updated)
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const user = await requireAuth(req)
  if (!user) return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })
  if (user.roleName !== 'ADMIN') return NextResponse.json({ error: 'Accesso negato' }, { status: 403 })

  const accessorio = await prisma.accessorio.findUnique({ where: { id: Number(id) } })
  if (!accessorio) return NextResponse.json({ error: 'Accessorio non trovato' }, { status: 404 })

  await prisma.accessorio.delete({ where: { id: Number(id) } })
  return NextResponse.json({ message: 'Accessorio eliminato' })
}