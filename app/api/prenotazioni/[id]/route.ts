import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { requireAuth } from '@/lib/auth-helper'

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireAuth(req)
  if (!user) return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })

  const { id } = await params
  const prenotazione = await prisma.prenotazione.findUnique({
    where: { id: parseInt(id) },
    include: {
      bicicletta: { include: { bicicletta: true } },
      location: true,
      copertura: true,
      prenotazioni: { include: { accessorio: true } },
    },
  })

  if (!prenotazione) {
    return NextResponse.json({ error: 'Prenotazione non trovata' }, { status: 404 })
  }

  if (prenotazione.utenteId !== user.id && user.roleName === 'CUSTOMER') {
    return NextResponse.json({ error: 'Accesso negato' }, { status: 403 })
  }

  const result = {
    ...prenotazione,
    accessori: prenotazione.prenotazioni.map(ap => ap.accessorio),
    prenotazioni: undefined,
  }

  return NextResponse.json(result)
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireAuth(req)
  if (!user) return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })

  const { id } = await params
  const prenotazione = await prisma.prenotazione.findUnique({
    where: { id: parseInt(id) },
  })

  if (!prenotazione) {
    return NextResponse.json({ error: 'Prenotazione non trovata' }, { status: 404 })
  }

  if (prenotazione.utenteId !== user.id) {
    return NextResponse.json({ error: 'Accesso negato' }, { status: 403 })
  }

  // Verifica che siano passati almeno 2 giorni dalla data di ritiro
  const dueGiorniPrima = new Date(prenotazione.dataRitiro)
  dueGiorniPrima.setDate(dueGiorniPrima.getDate() - 2)

  if (new Date() >= dueGiorniPrima) {
    return NextResponse.json({
      error: 'La prenotazione può essere cancellata solo fino a 2 giorni prima del ritiro',
    }, { status: 400 })
  }

  if (prenotazione.stato !== 'PENDING') {
    return NextResponse.json({ error: 'Solo prenotazioni in attesa possono essere cancellate' }, { status: 400 })
  }

  await prisma.prenotazione.delete({ where: { id: parseInt(id) } })

  await prisma.notifica.create({
    data: {
      messaggio: `Prenotazione #${id} cancellata`,
      tipo: 'cancellazione_prenotazione',
      utenteId: user.id,
    },
  })

  return NextResponse.json({ message: 'Prenotazione cancellata' })
}
