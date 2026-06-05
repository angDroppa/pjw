import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { requireAuth } from '@/lib/auth-helper'

export async function GET(req: Request) {
  const user = await requireAuth(req)
  if (!user) return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })

  const notifiche = await prisma.notifica.findMany({
    where: { utenteId: user.id },
    orderBy: { sentAt: 'desc' },
    take: 50,
  })

  return NextResponse.json(notifiche)
}

export async function PATCH(req: Request) {
  const user = await requireAuth(req)
  if (!user) return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })

  const body = await req.json()
  const { notificaId } = body

  if (notificaId) {
    await prisma.notifica.update({
      where: { id: notificaId },
      data: { letto: true },
    })
  } else {
    // Segna tutte come lette
    await prisma.notifica.updateMany({
      where: { utenteId: user.id, letto: false },
      data: { letto: true },
    })
  }

  return NextResponse.json({ ok: true })
}
