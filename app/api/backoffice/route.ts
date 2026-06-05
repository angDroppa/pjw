import prisma from '@/lib/prisma'
import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth-helper'
import { CreateLocationSchema, UpdateLocationSchema } from '@/lib/zodSchemas/location'
import { CreateAccessorioSchema } from '@/lib/zodSchemas/accessorio'
import { UpdateAccessorioSchema } from '@/lib/zodSchemas/accessorio'
import { CreateAssicurazioneSchema, UpdateAssicurazioneSchema } from '@/lib/zodSchemas/assicurazione'
import { CreateBiciclettaSchema, CreateSpecificheSchema, UpdateSpecificheSchema } from '@/lib/zodSchemas/bicicletta'
import { CreateBiciclettaLocationSchema, UpdateBiciclettaLocationSchema } from '@/lib/zodSchemas/biciclettaLocation'
import { CreateBiciclettaIstanzaSchema } from '@/lib/zodSchemas/biciclettaIstanza'
import { UpdateStatoSchema } from '@/lib/zodSchemas/prenotazione'
import { Prisma } from '@/app/generated/prisma/client'

export async function GET(req: Request) {
  const user = await requireAuth(req)
  if (!user) return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const action = searchParams.get('action')

  try {

    // ── CONFIG ────────────────────────────────────────────────────────────────
    if (action === 'config') {
      const [negozi, accessori, assicurazioni] = await prisma.$transaction([
        prisma.location.findMany({
          include: {
            biciclette: {
              include: {
                biciclettaSpecific: {
                  include: { bicicletta: true }
                },
                istanze: {
                  select: { id: true, codice: true, occupata: true, occupataDa: true, occupataA: true }
                }
              }
            }
          }
        }),
        prisma.accessorio.findMany(),
        prisma.assicurazione.findMany(),
      ])
      return NextResponse.json({ negozi, accessori, assicurazioni })
    }

    // ── PRENOTAZIONI ──────────────────────────────────────────────────────────
    if (action === 'prenotazioni') {
      const utente = searchParams.get('utente')
      const data = searchParams.get('data')
      const locationId = searchParams.get('locationId')

      const where: Prisma.PrenotazioneWhereInput = {}

      if (utente) {
        where.utente = {
          OR: [
            { firstName: { contains: utente, mode: 'insensitive' } },
            { lastName: { contains: utente, mode: 'insensitive' } },
          ]
        }
      }
      if (data) {
        const d = new Date(data)
        where.dataRitiro = {
          gte: new Date(new Date(d).setHours(0, 0, 0, 0)),
          lte: new Date(new Date(d).setHours(23, 59, 59, 999)),
        }
      }
      if (locationId) where.locationId = parseInt(locationId)

      const prenotazioni = await prisma.prenotazione.findMany({
        where,
        include: {
          utente: { select: { firstName: true, lastName: true, email: true } },
          bicicletta: { include: { bicicletta: true } },
          biciclettaIstanza: true,
          location: true,
          copertura: true,
          prenotazioni: { include: { accessorio: true } },
        },
        orderBy: { dataRitiro: 'asc' },
      })

      const mapped = prenotazioni.map(p => ({
        ...p,
        accessori: p.prenotazioni.map(ap => ap.accessorio),
        prenotazioni: undefined,
      }))

      return NextResponse.json(mapped)
    }

    // ── CATALOGO ──────────────────────────────────────────────────────────────
    if (action === 'catalogo') {
      const [biciclette, negozi] = await prisma.$transaction([
        prisma.bicicletta.findMany({
          include: { specifics: true }
        }),
        prisma.location.findMany({
          select: { id: true, nome: true }
        }),
      ])
      return NextResponse.json({ biciclette, negozi })
    }

    // ── ISTANZE ────────────────────────────────────────────────────────────────
    if (action === 'elenco_istanze') {
      const where: Record<string, unknown> = {}
      const locationId = searchParams.get('locationId')
      const specificaId = searchParams.get('specificaId')
      if (locationId) where.locationId = parseInt(locationId)
      if (specificaId) where.specificheBiciclettaId = parseInt(specificaId)
      const istanze = await prisma.biciclettaIstanza.findMany({
        where: where as never,
        include: {
          specificheBicicletta: { include: { bicicletta: true } },
          location: true,
          prenotazioni: {
            where: { stato: { not: 'RETURNED' } },
            select: { id: true, dataRitiro: true, dataConsegna: true, stato: true },
          },
        },
        orderBy: { codice: 'asc' },
      })
      return NextResponse.json(istanze)
    }

    // ── STATISTICHE ───────────────────────────────────────────────────────────
    if (action === 'statistiche') {
      if (user.roleName !== 'ADMIN')
        return NextResponse.json({ error: 'Accesso negato' }, { status: 403 })

      const da = searchParams.get('da')
      const a = searchParams.get('a')
      const periodoClause = da && a
        ? { dataRitiro: { gte: new Date(da), lte: new Date(a) } }
        : {}

      const baseWhere = {
        NOT: { stato: 'RETURNED' as const },
        ...periodoClause,
      }

      const aggregati = await prisma.prenotazione.aggregate({
        _count: { id: true },
        _sum: { totalePagato: true },
        where: baseWhere,
      })

      const performanceRaw = await prisma.prenotazione.groupBy({
        by: ['locationId'],
        _sum: { totalePagato: true },
        where: baseWhere,
      })

      const infoNegozi = await prisma.location.findMany({
        where: { id: { in: performanceRaw.map(p => p.locationId) } },
        select: { id: true, nome: true },
      })

      const shopPerformance = performanceRaw.map(p => ({
        name: infoNegozi.find(n => n.id === p.locationId)?.nome ?? `Negozio #${p.locationId}`,
        revenue: Number(p._sum.totalePagato ?? 0),
      }))

      const biciRaw = await prisma.prenotazione.groupBy({
        by: ['biciclettaId'],
        _count: { id: true },
        orderBy: { _count: { id: 'desc' } },
        take: 5,
        where: baseWhere,
      })

      const infoBici = await prisma.specificheBicicletta.findMany({
        where: { id: { in: biciRaw.map(b => b.biciclettaId) } },
        include: { bicicletta: true },
      })

      const mostUsedBikes = biciRaw.map(b => ({
        model: infoBici.find(i => i.id === b.biciclettaId)?.bicicletta.nome ?? `Bici #${b.biciclettaId}`,
        rentals: b._count.id,
      }))

      return NextResponse.json({
        totalBookings: aggregati._count.id,
        totalRevenue: Number(aggregati._sum.totalePagato ?? 0),
        shopPerformance,
        mostUsedBikes,
        periodoFiltrato: da && a ? { da, a } : null,
      })
    }

    return NextResponse.json({ error: 'Azione GET non valida' }, { status: 400 })

  } catch (error) {
    console.error('[BACKOFFICE GET]', error)
    return NextResponse.json({ error: 'Errore interno del server' }, { status: 500 })
  }
}

// ==========================================
// POST
// ==========================================
export async function POST(req: Request) {
  const user = await requireAuth(req)
  if (!user) return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })

  const body = await req.json()
  const { action } = body

  const isAdmin = user.roleName === 'ADMIN'
  const denyAdmin = () => NextResponse.json({ error: 'Accesso negato' }, { status: 403 })

  try {

    // ── LOCATION ──────────────────────────────────────────────────────────────
    if (action === 'create_location') {
      if (!isAdmin) return denyAdmin()
      const parsed = CreateLocationSchema.safeParse(body)
      if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
      const location = await prisma.location.create({ data: parsed.data })
      return NextResponse.json(location)
    }

    if (action === 'update_location') {
      if (!isAdmin) return denyAdmin()
      const { locationId, ...rest } = body
      if (!locationId) return NextResponse.json({ error: 'locationId obbligatorio' }, { status: 400 })
      const parsed = UpdateLocationSchema.safeParse(rest)
      if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
      const updated = await prisma.location.update({
        where: { id: parseInt(locationId) },
        data: parsed.data,
      })
      return NextResponse.json(updated)
    }

    if (action === 'delete_location') {
      if (!isAdmin) return denyAdmin()
      const { locationId } = body
      if (!locationId) return NextResponse.json({ error: 'locationId obbligatorio' }, { status: 400 })
      await prisma.location.delete({ where: { id: parseInt(locationId) } })
      return NextResponse.json({ ok: true })
    }

    // ── ACCESSORI ─────────────────────────────────────────────────────────────
    if (action === 'create_accessorio') {
      if (!isAdmin) return denyAdmin()
      const parsed = CreateAccessorioSchema.safeParse(body)
      if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
      const created = await prisma.accessorio.create({ data: parsed.data })
      return NextResponse.json(created)
    }

    if (action === 'update_accessorio') {
      if (!isAdmin) return denyAdmin()
      const { accessorioId, ...rest } = body
      if (!accessorioId) return NextResponse.json({ error: 'accessorioId obbligatorio' }, { status: 400 })
      const parsed = UpdateAccessorioSchema.safeParse(rest)
      if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
      const updated = await prisma.accessorio.update({
        where: { id: parseInt(accessorioId) },
        data: parsed.data,
      })
      return NextResponse.json(updated)
    }

    if (action === 'delete_accessorio') {
      if (!isAdmin) return denyAdmin()
      const { accessorioId } = body
      if (!accessorioId) return NextResponse.json({ error: 'accessorioId obbligatorio' }, { status: 400 })
      await prisma.accessorio.delete({ where: { id: parseInt(accessorioId) } })
      return NextResponse.json({ ok: true })
    }

    // ── ASSICURAZIONI ─────────────────────────────────────────────────────────
    if (action === 'create_assicurazione') {
      if (!isAdmin) return denyAdmin()
      const parsed = CreateAssicurazioneSchema.safeParse(body)
      if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
      const created = await prisma.assicurazione.create({ data: parsed.data })
      return NextResponse.json(created)
    }

    if (action === 'update_assicurazione') {
      if (!isAdmin) return denyAdmin()
      const { assicurazioneId, ...rest } = body
      if (!assicurazioneId) return NextResponse.json({ error: 'assicurazioneId obbligatorio' }, { status: 400 })
      const parsed = UpdateAssicurazioneSchema.safeParse(rest)
      if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
      const updated = await prisma.assicurazione.update({
        where: { id: parseInt(assicurazioneId) },
        data: parsed.data,
      })
      return NextResponse.json(updated)
    }

    if (action === 'delete_assicurazione') {
      if (!isAdmin) return denyAdmin()
      const { assicurazioneId } = body
      if (!assicurazioneId) return NextResponse.json({ error: 'assicurazioneId obbligatorio' }, { status: 400 })
      await prisma.assicurazione.delete({ where: { id: parseInt(assicurazioneId) } })
      return NextResponse.json({ ok: true })
    }

    // ── BICICLETTE ────────────────────────────────────────────────────────────
    if (action === 'create_bicicletta') {
      if (!isAdmin) return denyAdmin()
      const parsed = CreateBiciclettaSchema.safeParse(body)
      if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
      const bici = await prisma.bicicletta.create({
        data: parsed.data,
        include: { specifics: true },
      })
      return NextResponse.json(bici)
    }

    if (action === 'create_specifica') {
      if (!isAdmin) return denyAdmin()
      const parsed = CreateSpecificheSchema.safeParse(body)
      if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
      const specifica = await prisma.specificheBicicletta.create({ data: parsed.data })
      return NextResponse.json(specifica)
    }

    if (action === 'delete_bicicletta') {
      if (!isAdmin) return denyAdmin()
      const { biciclettaId } = body
      if (!biciclettaId) return NextResponse.json({ error: 'biciclettaId obbligatorio' }, { status: 400 })
      await prisma.bicicletta.delete({ where: { id: parseInt(biciclettaId) } })
      return NextResponse.json({ ok: true })
    }

    if (action === 'delete_specifica') {
      if (!isAdmin) return denyAdmin()
      const { specificaId } = body
      if (!specificaId) return NextResponse.json({ error: 'specificaId obbligatorio' }, { status: 400 })
      await prisma.specificheBicicletta.delete({ where: { id: parseInt(specificaId) } })
      return NextResponse.json({ ok: true })
    }

    if (action === 'update_specifica') {
      if (!isAdmin) return denyAdmin()
      const { specificaId, ...rest } = body
      if (!specificaId) return NextResponse.json({ error: 'specificaId obbligatorio' }, { status: 400 })
      const parsed = UpdateSpecificheSchema.safeParse(rest)
      if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
      const updated = await prisma.specificheBicicletta.update({
        where: { id: parseInt(specificaId) },
        data: parsed.data,
      })
      return NextResponse.json(updated)
    }

    // ── ISTANZE (BiciclettaIstanza) ───────────────────────────────────────────
    if (action === 'genera_istanze') {
      if (!isAdmin) return denyAdmin()
      const { biciclettaLocationId } = body
      if (!biciclettaLocationId) return NextResponse.json({ error: 'biciclettaLocationId obbligatorio' }, { status: 400 })

      const stock = await prisma.biciclettaLocation.findUnique({
        where: { id: parseInt(biciclettaLocationId) },
      })
      if (!stock) return NextResponse.json({ error: 'Stock non trovato' }, { status: 404 })

      const esistenti = await prisma.biciclettaIstanza.count({
        where: { biciclettaLocationId: stock.id },
      })
      const daCreare = stock.quantita - esistenti
      if (daCreare <= 0) {
        return NextResponse.json({ message: 'Già al massimo delle istanze', createCount: 0 })
      }

      const istanze = []
      for (let i = esistenti + 1; i <= stock.quantita; i++) {
        istanze.push({
          codice: `BIKE-${stock.biciclettaSpecificId}-${stock.locationId}-${i}`,
          specificheBiciclettaId: stock.biciclettaSpecificId,
          locationId: stock.locationId,
          biciclettaLocationId: stock.id,
        })
      }
      await prisma.biciclettaIstanza.createMany({ data: istanze })
      return NextResponse.json({ message: `${istanze.length} istanze create`, createCount: istanze.length })
    }

    if (action === 'get_istanze') {
      const { biciclettaLocationId } = body
      const where: Record<string, unknown> = {}
      if (biciclettaLocationId) where.biciclettaLocationId = parseInt(biciclettaLocationId)
      const istanze = await prisma.biciclettaIstanza.findMany({
        where: where as never,
        include: {
          specificheBicicletta: { include: { bicicletta: true } },
          location: true,
          prenotazioni: { select: { id: true, dataRitiro: true, dataConsegna: true, stato: true } },
        },
        orderBy: { codice: 'asc' },
      })
      return NextResponse.json(istanze)
    }

    if (action === 'delete_istanza') {
      if (!isAdmin) return denyAdmin()
      const { istanzaId } = body
      if (!istanzaId) return NextResponse.json({ error: 'istanzaId obbligatorio' }, { status: 400 })
      await prisma.biciclettaIstanza.delete({ where: { id: parseInt(istanzaId) } })
      return NextResponse.json({ ok: true })
    }

    if (action === 'libera_istanza') {
      if (!isAdmin) return denyAdmin()
      const { istanzaId } = body
      if (!istanzaId) return NextResponse.json({ error: 'istanzaId obbligatorio' }, { status: 400 })
      const istanza = await prisma.biciclettaIstanza.update({
        where: { id: parseInt(istanzaId) },
        data: { occupata: false, occupataDa: null, occupataA: null },
      })
      return NextResponse.json(istanza)
    }

    // ── STOCK (BiciclettaLocation) ────────────────────────────────────────────
    if (action === 'aggiungi_bici_negozio') {
      if (!isAdmin) return denyAdmin()
      const parsed = CreateBiciclettaLocationSchema.safeParse(body)
      if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })

      const [bici, negozio] = await Promise.all([
        prisma.specificheBicicletta.findUnique({ where: { id: parsed.data.biciclettaSpecificId } }),
        prisma.location.findUnique({ where: { id: parsed.data.locationId } }),
      ])
      if (!bici) return NextResponse.json({ error: 'Specifica bici non trovata' }, { status: 404 })
      if (!negozio) return NextResponse.json({ error: 'Negozio non trovato' }, { status: 404 })

      const stock = await prisma.biciclettaLocation.upsert({
        where: {
          locationId_biciclettaSpecificId: {
            locationId: parsed.data.locationId,
            biciclettaSpecificId: parsed.data.biciclettaSpecificId,
          }
        },
        update: {
          quantita: { increment: parsed.data.quantita },
        },
        create: parsed.data,
        include: {
          biciclettaSpecific: { include: { bicicletta: true } },
          location: true,
        },
      })

      // Genera istanze per le nuove bici
      const esistenti = await prisma.biciclettaIstanza.count({
        where: { biciclettaLocationId: stock.id },
      })
      const nuovoTotale = parsed.data.quantita
      const istanze = []
      for (let i = esistenti + 1; i <= esistenti + nuovoTotale; i++) {
        istanze.push({
          codice: `BIKE-${stock.biciclettaSpecificId}-${stock.locationId}-${i}`,
          specificheBiciclettaId: stock.biciclettaSpecificId,
          locationId: stock.locationId,
          biciclettaLocationId: stock.id,
        })
      }
      if (istanze.length > 0) {
        await prisma.biciclettaIstanza.createMany({ data: istanze })
      }

      return NextResponse.json(stock)
    }

    if (action === 'update_stock') {
      if (!isAdmin) return denyAdmin()
      const { biciclettaLocationId, ...rest } = body
      if (!biciclettaLocationId) return NextResponse.json({ error: 'biciclettaLocationId obbligatorio' }, { status: 400 })
      const parsed = UpdateBiciclettaLocationSchema.safeParse(rest)
      if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
      const updated = await prisma.biciclettaLocation.update({
        where: { id: parseInt(biciclettaLocationId) },
        data: parsed.data,
        include: { istanze: true },
      })

      // Sincronizza istanze: crea se il nuovo quantita è maggiore delle istanze esistenti
      const esistenti = updated.istanze.length
      if (parsed.data.quantita > esistenti) {
        const istanze = []
        for (let i = esistenti + 1; i <= parsed.data.quantita; i++) {
          istanze.push({
            codice: `BIKE-${updated.biciclettaSpecificId}-${updated.locationId}-${i}`,
            specificheBiciclettaId: updated.biciclettaSpecificId,
            locationId: updated.locationId,
            biciclettaLocationId: updated.id,
          })
        }
        if (istanze.length > 0) {
          await prisma.biciclettaIstanza.createMany({ data: istanze })
        }
      }

      return NextResponse.json(updated)
    }

    // ── STATO PRENOTAZIONE ────────────────────────────────────────────────────
    if (action === 'update_stato_prenotazione') {
      const { prenotazioneId, ...rest } = body
      if (!prenotazioneId) return NextResponse.json({ error: 'prenotazioneId obbligatorio' }, { status: 400 })
      const parsed = UpdateStatoSchema.safeParse(rest)
      if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })

      const prenotazione = await prisma.prenotazione.findUnique({
        where: { id: parseInt(prenotazioneId) }
      })
      if (!prenotazione) return NextResponse.json({ error: 'Prenotazione non trovata' }, { status: 404 })

      const updateData: Record<string, unknown> = {
        stato: parsed.data.stato,
        note: parsed.data.note ?? prenotazione.note,
      }
      if (parsed.data.noteRiconsegna !== undefined) updateData.noteRiconsegna = parsed.data.noteRiconsegna
      if (parsed.data.danni !== undefined) updateData.danni = parsed.data.danni

      const updated = await prisma.prenotazione.update({
        where: { id: parseInt(prenotazioneId) },
        data: updateData,
      })
      return NextResponse.json(updated)
    }

    return NextResponse.json({ error: 'Azione POST non valida' }, { status: 400 })

  } catch (error) {
    console.error('[BACKOFFICE POST]', error)
    return NextResponse.json({ error: 'Errore interno del server' }, { status: 500 })
  }
}
