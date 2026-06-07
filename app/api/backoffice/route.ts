import prisma from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'
import { requireSession } from '@/lib/auth/session'
import { CreateLocationSchema, UpdateLocationSchema } from '@/lib/validators/location'
import { CreateAccessorioSchema, UpdateAccessorioSchema } from '@/lib/validators/accessorio'
import { CreateAssicurazioneSchema, UpdateAssicurazioneSchema } from '@/lib/validators/assicurazione'
import { CreateBiciclettaSchema, CreateSpecificheSchema, UpdateSpecificheSchema } from '@/lib/validators/bicicletta'
import { CreateBiciclettaLocationSchema, UpdateBiciclettaLocationSchema } from '@/lib/validators/biciclettaLocation'
import { UpdatePrenotazioneSchema } from '@/lib/validators/prenotazione'
import { Prisma } from '@/app/generated/prisma/client'

export async function GET(req: NextRequest) {
    const session = await requireSession()

    const { searchParams } = new URL(req.url)
    const action = searchParams.get('action')

    try {

        // ── STOCK ─────────────────────────────────────────────────────────────────
        if (action === 'stock') {
            const stock = await prisma.biciclettaLocation.findMany({
                include: {
                    biciclettaSpecific: true,
                    location: true,
                },
            })
            return NextResponse.json(stock)
        }


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

        // ── STATISTICHE ───────────────────────────────────────────────────────────
        if (action === 'statistiche') {
            // if (session.role !== 'ADMIN')
            //     return NextResponse.json({ error: 'Accesso negato' }, { status: 403 })

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
        if ((error as Error).message === 'Unauthorized')
            return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })
        console.error('[BACKOFFICE GET]', error)
        return NextResponse.json({ error: 'Errore interno del server' }, { status: 500 })
    }
}

// ==========================================
// POST
// ==========================================
export async function POST(req: NextRequest) {
    await requireSession()

    const body = await req.json()
    const { action } = body

    try {

        // ── LOCATION ──────────────────────────────────────────────────────────────
        if (action === 'create_location') {
            const parsed = CreateLocationSchema.safeParse(body)
            if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
            const location = await prisma.location.create({ data: parsed.data })
            return NextResponse.json(location)
        }

        if (action === 'update_location') {
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
            const { locationId } = body
            if (!locationId) return NextResponse.json({ error: 'locationId obbligatorio' }, { status: 400 })
            await prisma.location.delete({ where: { id: parseInt(locationId) } })
            return NextResponse.json({ ok: true })
        }

        // ── ACCESSORI ─────────────────────────────────────────────────────────────
        if (action === 'create_accessorio') {
            const parsed = CreateAccessorioSchema.safeParse(body)
            if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
            const created = await prisma.accessorio.create({ data: parsed.data })
            return NextResponse.json(created)
        }

        if (action === 'update_accessorio') {
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
            const { accessorioId } = body
            if (!accessorioId) return NextResponse.json({ error: 'accessorioId obbligatorio' }, { status: 400 })
            await prisma.accessorio.delete({ where: { id: parseInt(accessorioId) } })
            return NextResponse.json({ ok: true })
        }

        // ── ASSICURAZIONI ─────────────────────────────────────────────────────────
        if (action === 'create_assicurazione') {
            const parsed = CreateAssicurazioneSchema.safeParse(body)
            if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
            const created = await prisma.assicurazione.create({ data: parsed.data })
            return NextResponse.json(created)
        }

        if (action === 'update_assicurazione') {
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
            const { assicurazioneId } = body
            if (!assicurazioneId) return NextResponse.json({ error: 'assicurazioneId obbligatorio' }, { status: 400 })
            await prisma.assicurazione.delete({ where: { id: parseInt(assicurazioneId) } })
            return NextResponse.json({ ok: true })
        }

        // ── BICICLETTE ────────────────────────────────────────────────────────────
        if (action === 'create_bicicletta') {
            const parsed = CreateBiciclettaSchema.safeParse(body)
            if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
            const { specifics, ...biciclettaData } = parsed.data
            const bici = await prisma.bicicletta.create({
                data: {
                    ...biciclettaData,
                    specifics: { create: specifics },
                },
                include: { specifics: true },
            })
            return NextResponse.json(bici)
        }

        if (action === 'create_specifica') {
            const parsed = CreateSpecificheSchema.safeParse(body)
            if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
            const specifica = await prisma.specificheBicicletta.create({ data: parsed.data })
            return NextResponse.json(specifica)
        }

        if (action === 'delete_bicicletta') {
            const { biciclettaId } = body
            if (!biciclettaId) return NextResponse.json({ error: 'biciclettaId obbligatorio' }, { status: 400 })
            await prisma.bicicletta.delete({ where: { id: parseInt(biciclettaId) } })
            return NextResponse.json({ ok: true })
        }

        if (action === 'delete_specifica') {
            const { specificaId } = body
            if (!specificaId) return NextResponse.json({ error: 'specificaId obbligatorio' }, { status: 400 })
            await prisma.specificheBicicletta.delete({ where: { id: parseInt(specificaId) } })
            return NextResponse.json({ ok: true })
        }

        if (action === 'update_specifica') {
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

        // ── STOCK (BiciclettaLocation) ────────────────────────────────────────────
        if (action === 'aggiungi_bici_negozio') {
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
                    quantitaMuscolare: { increment: parsed.data.quantitaMuscolare },
                    quantitaElettrica: { increment: parsed.data.quantitaElettrica },
                },
                create: parsed.data,
                include: {
                    biciclettaSpecific: { include: { bicicletta: true } },
                    location: true,
                },
            })

            return NextResponse.json(stock)
        }


        if (action === 'update_stock') {
            const { biciclettaLocationId, ...rest } = body
            if (!biciclettaLocationId) return NextResponse.json({ error: 'biciclettaLocationId obbligatorio' }, { status: 400 })
            const parsed = UpdateBiciclettaLocationSchema.safeParse(rest)
            if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
            const updated = await prisma.biciclettaLocation.update({
                where: { id: parseInt(biciclettaLocationId) },
                data: parsed.data,
                include: {
                    biciclettaSpecific: { include: { bicicletta: true } },
                    location: true,
                },
            })
            return NextResponse.json(updated)
        }

        // ── STATO PRENOTAZIONE ────────────────────────────────────────────────────
        if (action === 'update_stato_prenotazione') {
            const { prenotazioneId, ...rest } = body
            if (!prenotazioneId) return NextResponse.json({ error: 'prenotazioneId obbligatorio' }, { status: 400 })
            const parsed = UpdatePrenotazioneSchema.safeParse(rest)
            if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })

            const prenotazione = await prisma.prenotazione.findUnique({
                where: { id: parseInt(prenotazioneId) }
            })
            if (!prenotazione) return NextResponse.json({ error: 'Prenotazione non trovata' }, { status: 404 })

            const updated = await prisma.prenotazione.update({
                where: { id: parseInt(prenotazioneId) },
                data: {
                    ...(parsed.data.stato !== undefined && { stato: parsed.data.stato }),
                    ...(parsed.data.noteRiconsegna !== undefined && { noteRiconsegna: parsed.data.noteRiconsegna }),
                    ...(parsed.data.danni !== undefined && { danni: parsed.data.danni }),
                },
            })
            return NextResponse.json(updated)
        }

        return NextResponse.json({ error: 'Azione POST non valida' }, { status: 400 })

    } catch (error) {
        if ((error as Error).message === 'Unauthorized')
            return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })
        console.error('[BACKOFFICE POST]', error)
        return NextResponse.json({ error: 'Errore interno del server' }, { status: 500 })
    }


}

