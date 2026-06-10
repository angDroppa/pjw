import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { requireSession } from '@/lib/auth/session'
import { UpdatePrenotazioneClienteSchema } from '@/lib/validators/prenotazione'
import { getDisponibileCount } from '@/lib/disponibilita/disponibilita'

function giorniAlRitiro(dataRitiro: Date): number {
  return Math.ceil((dataRitiro.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireSession()

  const { id } = await params
  const parsedId = parseInt(id)

  if (!parsedId)
    return NextResponse.json({ error: 'id non valido' }, { status: 400 })

  const prenotazione = await prisma.prenotazione.findUnique({
    where: { id: parsedId },
  })

  if (!prenotazione)
    return NextResponse.json({ error: 'Non trovata' }, { status: 404 })

  if (prenotazione.utenteId !== session.userId)
    return NextResponse.json({ error: 'Non autorizzato' }, { status: 403 })

  if (prenotazione.stato !== 'PENDING')
    return NextResponse.json({ error: 'Non modificabile' }, { status: 400 })

  if (giorniAlRitiro(prenotazione.dataRitiro) < 2)
    return NextResponse.json(
      { error: 'Meno di 2 giorni al ritiro' },
      { status: 400 }
    )

  const body = await req.json()
  const parsed = UpdatePrenotazioneClienteSchema.safeParse(body)

  if (!parsed.success)
    return NextResponse.json(
      { error: parsed.error.flatten() },
      { status: 400 }
    )

  const data = parsed.data

  const biciclettaId = data.biciclettaId ?? prenotazione.biciclettaId
  const locationId = data.locationId ?? prenotazione.locationId
  const alimentazione =
    data.alimentazione ?? prenotazione.alimentazione
  const dataRitiro = data.dataRitiro
    ? new Date(data.dataRitiro)
    : prenotazione.dataRitiro
  const dataConsegna = data.dataConsegna
    ? new Date(data.dataConsegna)
    : prenotazione.dataConsegna

  const cambiataDisponibilita =
    data.biciclettaId !== undefined ||
    data.locationId !== undefined ||
    data.alimentazione !== undefined ||
    data.dataRitiro !== undefined ||
    data.dataConsegna !== undefined

  if (cambiataDisponibilita) {
    const disponibile = await getDisponibileCount(
      biciclettaId,
      locationId,
      alimentazione,
      dataRitiro,
      dataConsegna
    )

    if (disponibile === 0)
      return NextResponse.json(
        {
          error:
            'Nessuna disponibilità per la combinazione richiesta.',
        },
        { status: 409 }
      )
  }

  if (data.accessoriIds !== undefined) {
    await prisma.accessorioPrenotazione.deleteMany({
      where: { prenotazioneId: parsedId },
    })
  }

  const { accessoriIds, dataRitiro: dr, dataConsegna: dc, ...rest } =
    data

  const updated = await prisma.prenotazione.update({
    where: { id: parsedId },
    data: {
      ...rest,
      ...(dr && { dataRitiro: new Date(dr) }),
      ...(dc && { dataConsegna: new Date(dc) }),
      ...(accessoriIds && {
        prenotazioni: {
          create: accessoriIds.map((accessorioId) => ({
            accessorioId,
          })),
        },
      }),
    },
    include: {
      utente: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          roleName: true,
        },
      },
      bicicletta: true,
      location: true,
      copertura: true,
      prenotazioni: { include: { accessorio: true } },
    },
  })

  await prisma.notifica.create({
    data: {
      messaggio: `Prenotazione #${parsedId} modificata`,
      tipo: 'modifica_prenotazione',
      utenteId: session.userId,
    },
  })

  return NextResponse.json({
    ...updated,
    accessori: updated.prenotazioni.map((ap) => ap.accessorio),
    prenotazioni: undefined,
  })
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireSession()

  const { id } = await params
  const parsedId = parseInt(id)

  if (!parsedId)
    return NextResponse.json({ error: 'id non valido' }, { status: 400 })

  const prenotazione = await prisma.prenotazione.findUnique({
    where: { id: parsedId },
  })

  if (!prenotazione)
    return NextResponse.json({ error: 'Non trovata' }, { status: 404 })

  if (prenotazione.utenteId !== session.userId)
    return NextResponse.json({ error: 'Non autorizzato' }, { status: 403 })

  if (prenotazione.stato !== 'PENDING')
    return NextResponse.json(
      { error: 'Non cancellabile' },
      { status: 400 }
    )

  if (giorniAlRitiro(prenotazione.dataRitiro) < 2)
    return NextResponse.json(
      { error: 'Meno di 2 giorni al ritiro' },
      { status: 400 }
    )

  await prisma.prenotazione.delete({
    where: { id: parsedId },
  })

  await prisma.notifica.create({
    data: {
      messaggio: `Prenotazione #${parsedId} cancellata`,
      tipo: 'cancellazione_prenotazione',
      utenteId: session.userId,
    },
  })

  return NextResponse.json({ ok: true })
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireSession()

    const { id } = await params
    const parsedId = parseInt(id)

    if (!parsedId)
      return NextResponse.json({ error: 'id non valido' }, { status: 400 })

    const prenotazione = await prisma.prenotazione.findUnique({
      where: { id: parsedId },
      include: {
        utente: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            roleName: true,
          },
        },
        bicicletta: true,
        location: true,
        copertura: true,
        prenotazioni: { include: { accessorio: true } },
      },
    })

    if (!prenotazione)
      return NextResponse.json({ error: 'Non trovata' }, { status: 404 })

    if (prenotazione.utenteId !== session.userId) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 403 })
    }

    return NextResponse.json({
      ...prenotazione,
      accessori: prenotazione.prenotazioni.map((ap) => ap.accessorio),
      prenotazioni: undefined,
    }, { status: 200 })

  } catch (error) {
    return NextResponse.json({ error: 'Errore interno del server' }, { status: 500 })
  }
}