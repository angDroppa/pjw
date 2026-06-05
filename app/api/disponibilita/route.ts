import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { calcolaDisponibilita } from '@/lib/availability'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const dataRitiro = searchParams.get('dataRitiro')
  const oraRitiro = searchParams.get('oraRitiro')
  const dataConsegna = searchParams.get('dataConsegna')
  const oraConsegna = searchParams.get('oraConsegna')
  const locationId = searchParams.get('locationId')
  const biciclettaId = searchParams.get('biciclettaId')

  if (!dataRitiro || !oraRitiro || !dataConsegna || !oraConsegna) {
    return NextResponse.json({ error: 'Parametri data/ora obbligatori' }, { status: 400 })
  }

  try {
    const pickup = new Date(dataRitiro)
    const [rh, rm] = oraRitiro.split(':').map(Number)
    pickup.setHours(rh, rm, 0, 0)

    const ret = new Date(dataConsegna)
    const [ch, cm] = oraConsegna.split(':').map(Number)
    ret.setHours(ch, cm, 0, 0)

    if (pickup < new Date()) {
      return NextResponse.json({ error: 'La data di ritiro non può essere nel passato' }, { status: 400 })
    }
    if (ret <= pickup) {
      return NextResponse.json({ error: 'La riconsegna deve avvenire dopo il ritiro' }, { status: 400 })
    }

    const where: Record<string, unknown> = {
      biciclettaSpecific: {},
    }

    if (biciclettaId) {
      where.biciclettaSpecific = {
        ...(where.biciclettaSpecific as Record<string, unknown>),
        biciclettaId: parseInt(biciclettaId),
      }
    }
    if (locationId) {
      where.locationId = parseInt(locationId)
    }

    const stockEntries = await prisma.biciclettaLocation.findMany({
      where: where as never,
      include: {
        location: true,
        biciclettaSpecific: {
          include: { bicicletta: true },
        },
        istanze: true,
      },
    })

    const results = await Promise.all(
      stockEntries.map(async (stock) => {
        const disp = await calcolaDisponibilita(
          stock.biciclettaSpecificId,
          stock.locationId,
          new Date(dataRitiro),
          oraRitiro,
          new Date(dataConsegna),
          oraConsegna,
        )
        return {
          id: stock.id,
          locationId: stock.locationId,
          biciclettaSpecificId: stock.biciclettaSpecificId,
          quantita: stock.quantita,
          location: stock.location,
          biciclettaSpecific: stock.biciclettaSpecific,
          istanzeTotali: disp.istanzeTotali,
          istanzeDisponibili: disp.istanzeDisponibili,
        }
      }),
    )

    return NextResponse.json(results)
  } catch (error) {
    console.error('[DISPONIBILITA]', error)
    return NextResponse.json({ error: 'Errore interno del server' }, { status: 500 })
  }
}
