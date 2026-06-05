import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { requireAuth } from '@/lib/auth-helper'
import { CreatePrenotazioneSchema } from '@/lib/zodSchemas/prenotazione'

export async function GET(req: Request) {
  const user = await requireAuth(req)
  if (!user) return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })

  const prenotazioni = await prisma.prenotazione.findMany({
    where: { utenteId: user.id },
    include: {
      bicicletta: { include: { bicicletta: true } },
      location: true,
      copertura: true,
      prenotazioni: { include: { accessorio: true } },
    },
    orderBy: { dataRitiro: 'desc' },
  })

  const mapped = prenotazioni.map(p => ({
    ...p,
    accessori: p.prenotazioni.map(ap => ap.accessorio),
    prenotazioni: undefined,
  }))

  return NextResponse.json(mapped)
}

export async function POST(req: Request) {
  const user = await requireAuth(req)
  if (!user) return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })

  const body = await req.json()
  const parsed = CreatePrenotazioneSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  // Verifica che la bicicletta esista
  const specifica = await prisma.specificheBicicletta.findUnique({
    where: { id: parsed.data.biciclettaId },
  })
  if (!specifica) {
    return NextResponse.json({ error: 'Bicicletta non trovata' }, { status: 404 })
  }

  // Verifica disponibilità stock
  const stock = await prisma.biciclettaLocation.findUnique({
    where: {
      locationId_biciclettaSpecificId: {
        locationId: parsed.data.locationId,
        biciclettaSpecificId: parsed.data.biciclettaId,
      },
    },
  })
  if (!stock || stock.quantita <= 0) {
    return NextResponse.json({ error: 'Bicicletta non disponibile in questa location' }, { status: 409 })
  }

  // Calcola totale (prezzo giornaliero)
  const assicurazione = await prisma.assicurazione.findUnique({
    where: { id: parsed.data.assicurazioneId },
  })
  const accessoriList = parsed.data.accessoriIds.length > 0
    ? await prisma.accessorio.findMany({ where: { id: { in: parsed.data.accessoriIds } } })
    : []
  const prezzoBici = Number(specifica.prezzoGiornata)
  const prezzoAssicurazione = assicurazione ? Number(assicurazione.prezzo) : 0
  const prezzoAccessori = accessoriList.reduce((sum, a) => sum + a.prezzo, 0)
  const totale = prezzoBici + prezzoAssicurazione + prezzoAccessori

  const prenotazione = await prisma.prenotazione.create({
    data: {
      dataRitiro: new Date(parsed.data.dataRitiro),
      oraRitiro: parsed.data.oraRitiro,
      dataConsegna: new Date(parsed.data.dataConsegna),
      oraConsegna: parsed.data.oraConsegna,
      totalePagato: totale,
      utenteId: user.id,
      biciclettaId: parsed.data.biciclettaId,
      locationId: parsed.data.locationId,
      coperturaId: parsed.data.assicurazioneId,
      note: parsed.data.note,
      prenotazioni: {
        create: parsed.data.accessoriIds.map(id => ({ accessorioId: id })),
      },
    },
    include: {
      bicicletta: { include: { bicicletta: true } },
      location: true,
      copertura: true,
      prenotazioni: { include: { accessorio: true } },
    },
  })

  // Simula notifica di conferma
  await prisma.notifica.create({
    data: {
      messaggio: `Prenotazione #${prenotazione.id} confermata: ${prenotazione.dataRitiro.toLocaleDateString()} - €${totale.toFixed(2)}`,
      tipo: 'conferma_prenotazione',
      utenteId: user.id,
    },
  })
  console.log(`[SIMULA EMAIL] Conferma prenotazione #${prenotazione.id} per ${user.email}`)

  const result = {
    ...prenotazione,
    accessori: prenotazione.prenotazioni.map(ap => ap.accessorio),
    prenotazioni: undefined,
  }

  return NextResponse.json(result, { status: 201 })
}
