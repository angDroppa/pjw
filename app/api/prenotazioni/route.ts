import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { requireAuth } from '@/lib/auth-helper'
import { CreatePrenotazioneSchema } from '@/lib/zodSchemas/prenotazione'
import { calcolaPrezzoBici } from '@/lib/pricing'
import { assegnaIstanza } from '@/lib/availability'

export async function GET(req: Request) {
  const user = await requireAuth(req)
  if (!user) return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })

  const prenotazioni = await prisma.prenotazione.findMany({
    where: { utenteId: user.id },
    include: {
      bicicletta: { include: { bicicletta: true } },
      biciclettaIstanza: true,
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

  // Validazione date
  const pickup = new Date(parsed.data.dataRitiro)
  const ret = new Date(parsed.data.dataConsegna)
  const [rh, rm] = parsed.data.oraRitiro.split(':').map(Number)
  const [ch, cm] = parsed.data.oraConsegna.split(':').map(Number)
  pickup.setHours(rh, rm, 0, 0)
  ret.setHours(ch, cm, 0, 0)

  if (pickup < new Date()) {
    return NextResponse.json({ error: 'La data di ritiro non può essere nel passato' }, { status: 400 })
  }

  if (ret <= pickup) {
    return NextResponse.json({ error: 'La riconsegna deve avvenire dopo il ritiro' }, { status: 400 })
  }

  // Verifica che la bicicletta esista
  const specifica = await prisma.specificheBicicletta.findUnique({
    where: { id: parsed.data.biciclettaId },
  })
  if (!specifica) {
    return NextResponse.json({ error: 'Bicicletta non trovata' }, { status: 404 })
  }

  // Assegna un'istanza disponibile per il periodo richiesto
  // (la verifica stock è interna ad assegnaIstanza)
  const istanza = await assegnaIstanza(
    parsed.data.biciclettaId,
    parsed.data.locationId,
    parsed.data.dataRitiro,
    parsed.data.oraRitiro,
    parsed.data.dataConsegna,
    parsed.data.oraConsegna,
  )

  // Se non ci sono istanze (legacy) ma stock > 0, permetti comunque
  const stock = await prisma.biciclettaLocation.findUnique({
    where: {
      locationId_biciclettaSpecificId: {
        locationId: parsed.data.locationId,
        biciclettaSpecificId: parsed.data.biciclettaId,
      },
    },
    include: { istanze: { select: { id: true } } },
  })
  if (!stock) {
    return NextResponse.json({ error: 'Bicicletta non disponibile in questa location' }, { status: 409 })
  }
  if (!istanza && stock.istanze.length > 0) {
    return NextResponse.json({ error: 'Bicicletta non disponibile per il periodo richiesto' }, { status: 409 })
  }

  // Calcola totale (prezzo giornaliero)
  const assicurazione = await prisma.assicurazione.findUnique({
    where: { id: parsed.data.assicurazioneId },
  })
  const accessoriList = parsed.data.accessoriIds.length > 0
    ? await prisma.accessorio.findMany({ where: { id: { in: parsed.data.accessoriIds } } })
    : []
  const prezzoBici = calcolaPrezzoBici(
    Number(specifica.prezzoGiornata),
    Number(specifica.prezzoMezzaGiornata),
    parsed.data.dataRitiro,
    parsed.data.oraRitiro,
    parsed.data.dataConsegna,
    parsed.data.oraConsegna
  ).prezzo
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
      biciclettaIstanzaId: istanza?.id ?? null,
      locationId: parsed.data.locationId,
      coperturaId: parsed.data.assicurazioneId,
      note: parsed.data.note,
      prenotazioni: {
        create: parsed.data.accessoriIds.map(id => ({ accessorioId: id })),
      },
    },
    include: {
      bicicletta: { include: { bicicletta: true } },
      biciclettaIstanza: true,
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
