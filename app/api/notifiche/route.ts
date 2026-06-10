import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getSession } from '@/lib/auth/session'

export async function GET() {
  const session = await getSession()

  if (!session) {
    return NextResponse.json(
      { error: 'Non autorizzato' },
      { status: 401 }
    )
  }

  const notifiche = await prisma.notifica.findMany({
    where: { utenteId: session.userId },
    orderBy: { sentAt: 'desc' },
    take: 50,
  })

  return NextResponse.json(notifiche)
}

export async function PATCH(req: Request) {
  const session = await getSession()

  if (!session) {
    return NextResponse.json(
      { error: 'Non autorizzato' },
      { status: 401 }
    )
  }

  const body = await req.json()
  const { notificaId } = body

  if (notificaId) {
    await prisma.notifica.update({
      where: { id: notificaId },
      data: { letto: true },
    })
  } else {
    await prisma.notifica.updateMany({
      where: {
        utenteId: session.userId,
        letto: false,
      },
      data: { letto: true },
    })
  }

  return NextResponse.json({ ok: true })
}
// rm -rf /