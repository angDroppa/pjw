import prisma from '@/lib/prisma'
import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth-helper'

// ==========================================
// GET
// ==========================================
export async function GET(req: Request) {
  const user = await requireAuth(req)
  if (!user) return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const action = searchParams.get('action')

  try {
    // ── CONFIG globale ────────────────────────────────────────────────────────
    if (action === 'config') {
      const [negozi, accessori, assicurazioni] = await prisma.$transaction([
        prisma.location.findMany({
          include: {
            stocks: {
              include: {
                bicicletta: {
                  include: { modello: true, tipologie: true, dimensioni: true }
                }
              }
            }
          }
        }),
        prisma.accessorio.findMany(),
        prisma.assicurazione.findMany()
      ])
      return NextResponse.json({ negozi, accessori, assicurazioni })
    }

    // ── PRENOTAZIONI filtrate ─────────────────────────────────────────────────
    if (action === 'prenotazioni') {
      const utente    = searchParams.get('utente')
      const data      = searchParams.get('data')
      const locationId = searchParams.get('locationId')
      const whereClause: any = {}

      if (utente) {
        whereClause.utente = {
          OR: [
            { firstName: { contains: utente, mode: 'insensitive' } },
            { lastName:  { contains: utente, mode: 'insensitive' } }
          ]
        }
      }
      if (data) {
        const d = new Date(data)
        whereClause.dataRitiro = {
          gte: new Date(new Date(d).setHours(0, 0, 0, 0)),
          lte: new Date(new Date(d).setHours(23, 59, 59, 999))
        }
      }
      if (locationId) whereClause.locationId = parseInt(locationId)

      const prenotazioni = await prisma.prenotazione.findMany({
        where: whereClause,
        include: {
          utente:     { select: { firstName: true, lastName: true, email: true } },
          bicicletta: { include: { modello: true } },
          location:   true,
          copertura:  true,
          accessori:  true
        },
        orderBy: { dataRitiro: 'asc' }
      })
      return NextResponse.json(prenotazioni)
    }

    // ── CATALOGO bici (per modale stock) ─────────────────────────────────────
    if (action === 'catalogo') {
      const [biciclette, negozi, modelli, tipologie] = await prisma.$transaction([
        prisma.bicicletta.findMany({
          include: { modello: true, tipologie: true, dimensioni: true }
        }),
        prisma.location.findMany({ select: { id: true, nome: true } }),
        prisma.modello.findMany(),
        prisma.tipologia.findMany()
      ])
      return NextResponse.json({ biciclette, negozi, modelli, tipologie })
    }

    // ── STATISTICHE (solo ADMIN) ──────────────────────────────────────────────
    if (action === 'statistiche') {
      if (user.roleName !== 'ADMIN')
        return NextResponse.json({ error: 'Accesso negato' }, { status: 403 })

      const da = searchParams.get('da')
      const a  = searchParams.get('a')
      const periodoClause = da && a
        ? { dataRitiro: { gte: new Date(da), lte: new Date(a) } } : {}
      const baseWhere = { NOT: { stato: 'CANCELLED' as const }, ...periodoClause }

      const aggregatiGlobali = await prisma.prenotazione.aggregate({
        _count: { id: true }, _sum: { totalePagato: true }, where: baseWhere
      })
      const performanceNegoziRaw = await prisma.prenotazione.groupBy({
        by: ['locationId'], _sum: { totalePagato: true }, where: baseWhere
      })
      const infoNegozi = await prisma.location.findMany({
        where: { id: { in: performanceNegoziRaw.map(p => p.locationId) } },
        select: { id: true, nome: true }
      })
      const shopPerformance = performanceNegoziRaw.map(p => ({
        name:    infoNegozi.find(n => n.id === p.locationId)?.nome || `Negozio #${p.locationId}`,
        revenue: p._sum.totalePagato || 0
      }))
      const biciPiuUsateRaw = await prisma.prenotazione.groupBy({
        by: ['biciclettaId'], _count: { id: true },
        orderBy: { _count: { id: 'desc' } }, take: 5, where: baseWhere
      })
      const infoBici = await prisma.bicicletta.findMany({
        where: { id: { in: biciPiuUsateRaw.map(b => b.biciclettaId) } },
        include: { modello: true }
      })
      const mostUsedBikes = biciPiuUsateRaw.map(b => ({
        model:   infoBici.find(i => i.id === b.biciclettaId)?.modello.nome || `Modello #${b.biciclettaId}`,
        rentals: b._count.id
      }))

      return NextResponse.json({
        totalBookings: aggregatiGlobali._count.id,
        totalRevenue:  aggregatiGlobali._sum.totalePagato || 0,
        shopPerformance, mostUsedBikes,
        periodoFiltrato: da && a ? { da, a } : null
      })
    }

    return NextResponse.json({ error: 'Azione GET non valida' }, { status: 400 })
  } catch (error) {
    console.error('[GET] Errore:', error)
    return NextResponse.json({ error: 'Errore interno del server (GET)' }, { status: 500 })
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

  try {
    // ── CREA LOCATION ─────────────────────────────────────────────────────────
    if (action === 'create_location') {
      if (user.roleName !== 'ADMIN')
        return NextResponse.json({ error: 'Accesso negato' }, { status: 403 })
      const { nome, indirizzo, prezzoMezzaGiornata } = body
      if (!nome || !indirizzo)
        return NextResponse.json({ error: 'nome e indirizzo obbligatori' }, { status: 400 })

      const location = await prisma.location.create({
        data: {
          nome,
          indirizzo,
          prezzoMezzaGiornata: prezzoMezzaGiornata ? parseFloat(prezzoMezzaGiornata) : 0
        }
      })
      return NextResponse.json(location)
    }

    // ── AGGIORNA LOCATION ─────────────────────────────────────────────────────
    if (action === 'update_config') {
      if (user.roleName !== 'ADMIN')
        return NextResponse.json({ error: 'Accesso negato' }, { status: 403 })
      const { shopId, prezzoMezzaGiornata, nome, indirizzo } = body
      const updatedLocation = await prisma.location.update({
        where: { id: parseInt(shopId) },
        data: {
          prezzoMezzaGiornata: prezzoMezzaGiornata !== undefined ? parseFloat(prezzoMezzaGiornata) : undefined,
          nome:      nome      || undefined,
          indirizzo: indirizzo || undefined
        }
      })
      return NextResponse.json(updatedLocation)
    }

    // ── ELIMINA LOCATION ──────────────────────────────────────────────────────
    if (action === 'delete_location') {
      if (user.roleName !== 'ADMIN')
        return NextResponse.json({ error: 'Accesso negato' }, { status: 403 })
      const { locationId } = body
      if (!locationId)
        return NextResponse.json({ error: 'locationId obbligatorio' }, { status: 400 })
      await prisma.location.delete({ where: { id: parseInt(locationId) } })
      return NextResponse.json({ ok: true })
    }

    // ── CREA ACCESSORIO ───────────────────────────────────────────────────────
    if (action === 'create_accessorio') {
      if (user.roleName !== 'ADMIN')
        return NextResponse.json({ error: 'Accesso negato' }, { status: 403 })
      const { nome, prezzo } = body
      if (!nome)
        return NextResponse.json({ error: 'nome obbligatorio' }, { status: 400 })
      const created = await prisma.accessorio.create({
        data: { nome, prezzo: prezzo ? parseFloat(prezzo) : 0 }
      })
      return NextResponse.json(created)
    }

    // ── AGGIORNA ACCESSORIO ───────────────────────────────────────────────────
    if (action === 'update_accessorio') {
      if (user.roleName !== 'ADMIN')
        return NextResponse.json({ error: 'Accesso negato' }, { status: 403 })
      const { accessorioId, prezzo, nome } = body
      if (!accessorioId)
        return NextResponse.json({ error: 'accessorioId obbligatorio' }, { status: 400 })
      const updated = await prisma.accessorio.update({
        where: { id: parseInt(accessorioId) },
        data: {
          prezzo: prezzo !== undefined ? parseFloat(prezzo) : undefined,
          nome:   nome   || undefined
        }
      })
      return NextResponse.json(updated)
    }

    // ── ELIMINA ACCESSORIO ────────────────────────────────────────────────────
    if (action === 'delete_accessorio') {
      if (user.roleName !== 'ADMIN')
        return NextResponse.json({ error: 'Accesso negato' }, { status: 403 })
      const { accessorioId } = body
      if (!accessorioId)
        return NextResponse.json({ error: 'accessorioId obbligatorio' }, { status: 400 })
      await prisma.accessorio.delete({ where: { id: parseInt(accessorioId) } })
      return NextResponse.json({ ok: true })
    }

    // ── CREA ASSICURAZIONE ────────────────────────────────────────────────────
    if (action === 'create_assicurazione') {
      if (user.roleName !== 'ADMIN')
        return NextResponse.json({ error: 'Accesso negato' }, { status: 403 })
      const { tipo, dettagli, prezzo } = body
      if (!tipo || !dettagli)
        return NextResponse.json({ error: 'tipo e dettagli obbligatori' }, { status: 400 })
      const created = await prisma.assicurazione.create({
        data: { tipo, dettagli, prezzo: prezzo ? parseFloat(prezzo) : 0 }
      })
      return NextResponse.json(created)
    }

    // ── AGGIORNA ASSICURAZIONE ────────────────────────────────────────────────
    if (action === 'update_assicurazione') {
      if (user.roleName !== 'ADMIN')
        return NextResponse.json({ error: 'Accesso negato' }, { status: 403 })
      const { assicurazioneId, prezzo, tipo, dettagli } = body
      if (!assicurazioneId)
        return NextResponse.json({ error: 'assicurazioneId obbligatorio' }, { status: 400 })
      const updated = await prisma.assicurazione.update({
        where: { id: parseInt(assicurazioneId) },
        data: {
          prezzo:   prezzo   !== undefined ? parseFloat(prezzo) : undefined,
          tipo:     tipo     || undefined,
          dettagli: dettagli || undefined
        }
      })
      return NextResponse.json(updated)
    }

    // ── ELIMINA ASSICURAZIONE ─────────────────────────────────────────────────
    if (action === 'delete_assicurazione') {
      if (user.roleName !== 'ADMIN')
        return NextResponse.json({ error: 'Accesso negato' }, { status: 403 })
      const { assicurazioneId } = body
      if (!assicurazioneId)
        return NextResponse.json({ error: 'assicurazioneId obbligatorio' }, { status: 400 })
      await prisma.assicurazione.delete({ where: { id: parseInt(assicurazioneId) } })
      return NextResponse.json({ ok: true })
    }

    // ── CREA BICICLETTA con taglie e tipologie ────────────────────────────────
    // Body: {
    //   modelloId: number | nomeModello: string  (se modelloId non esiste, crea il modello)
    //   tipologieIds: number[]                   (ID tipologie esistenti)
    //   dimensioni: { taglia: string, quantitaElettrico: number, quantitaMuscolare: number }[]
    // }
    if (action === 'create_bicicletta') {
      if (user.roleName !== 'ADMIN')
        return NextResponse.json({ error: 'Accesso negato' }, { status: 403 })
      const { modelloId, nomeModello, tipologieIds, dimensioni } = body

      if (!tipologieIds || !Array.isArray(tipologieIds) || tipologieIds.length === 0)
        return NextResponse.json({ error: 'tipologieIds obbligatorio (array non vuoto)' }, { status: 400 })
      if (!dimensioni || !Array.isArray(dimensioni) || dimensioni.length === 0)
        return NextResponse.json({ error: 'dimensioni obbligatorie (array non vuoto)' }, { status: 400 })

      // Risolve il modello: usa quello esistente o ne crea uno nuovo
      let resolvedModelloId: number
      if (modelloId) {
        resolvedModelloId = parseInt(modelloId)
      } else if (nomeModello) {
        const m = await prisma.modello.upsert({
          where:  { id: -1 }, // forzare create via findFirst
          update: {},
          create: { nome: nomeModello }
        })
        // upsert su id=-1 non funziona, usiamo findFirst+create
        const existing = await prisma.modello.findFirst({ where: { nome: nomeModello } })
        if (existing) {
          resolvedModelloId = existing.id
        } else {
          const created = await prisma.modello.create({ data: { nome: nomeModello } })
          resolvedModelloId = created.id
        }
      } else {
        return NextResponse.json({ error: 'modelloId oppure nomeModello obbligatorio' }, { status: 400 })
      }

      const bici = await prisma.bicicletta.create({
        data: {
          modelloId: resolvedModelloId,
          tipologie: {
            connect: tipologieIds.map((id: number) => ({ id }))
          },
          dimensioni: {
            create: dimensioni.map((d: { taglia: string; quantitaElettrico: number; quantitaMuscolare: number }) => ({
              taglia:            d.taglia,
              quantitaElettrico: d.quantitaElettrico ?? 0,
              quantitaMuscolare: d.quantitaMuscolare ?? 0
            }))
          }
        },
        include: { modello: true, tipologie: true, dimensioni: true }
      })
      return NextResponse.json(bici)
    }

    // ── ELIMINA BICICLETTA ────────────────────────────────────────────────────
    if (action === 'delete_bicicletta') {
      if (user.roleName !== 'ADMIN')
        return NextResponse.json({ error: 'Accesso negato' }, { status: 403 })
      const { biciclettaId } = body
      if (!biciclettaId)
        return NextResponse.json({ error: 'biciclettaId obbligatorio' }, { status: 400 })
      await prisma.bicicletta.delete({ where: { id: parseInt(biciclettaId) } })
      return NextResponse.json({ ok: true })
    }

    // ── CAMBIO STATO PRENOTAZIONE ─────────────────────────────────────────────
    if (action === 'update_stato_prenotazione') {
      const { prenotazioneId, stato, noteProblemi } = body
      if (!prenotazioneId || !stato)
        return NextResponse.json({ error: 'prenotazioneId e stato sono obbligatori' }, { status: 400 })

      const statiValidi = ['PENDING', 'PICKED_UP', 'RETURNED', 'LATE', 'DAMAGED', 'CANCELLED']
      if (!statiValidi.includes(stato))
        return NextResponse.json({ error: `Stato non valido. Valori ammessi: ${statiValidi.join(', ')}` }, { status: 400 })

      if (stato === 'RETURNED') {
        const prenotazione = await prisma.prenotazione.findUnique({
          where:  { id: parseInt(prenotazioneId) },
          select: { biciclettaId: true, locationId: true, stato: true }
        })
        if (!prenotazione)
          return NextResponse.json({ error: 'Prenotazione non trovata' }, { status: 404 })
        if (prenotazione.stato === 'RETURNED')
          return NextResponse.json({ error: 'Prenotazione già contrassegnata come restituita' }, { status: 400 })

        const [updatedPrenotazione] = await prisma.$transaction([
          prisma.prenotazione.update({
            where: { id: parseInt(prenotazioneId) },
            data:  { stato: 'RETURNED', noteProblemi: noteProblemi || undefined }
          }),
          prisma.stockBicicletta.updateMany({
            where: { locationId: prenotazione.locationId, biciclettaId: prenotazione.biciclettaId },
            data:  { quantita: { increment: 1 } }
          })
        ])
        return NextResponse.json(updatedPrenotazione)
      }

      const updatedPrenotazione = await prisma.prenotazione.update({
        where: { id: parseInt(prenotazioneId) },
        data: {
          stato:       stato,
          noteProblemi: noteProblemi || undefined,
          dataPickUp:  stato === 'PICKED_UP' ? new Date() : undefined
        }
      })
      return NextResponse.json(updatedPrenotazione)
    }

    // ── GESTIONE STOCK (±1 / manutenzione) ───────────────────────────────────
    if (action === 'update_stock') {
      const { locationId, biciclettaId, azione_stock } = body
      if (!locationId || !biciclettaId || !azione_stock)
        return NextResponse.json({ error: 'locationId, biciclettaId e azione_stock sono obbligatori' }, { status: 400 })

      const azioniValide = ['incrementa', 'riduce', 'manutenzione_in', 'manutenzione_out']
      if (!azioniValide.includes(azione_stock))
        return NextResponse.json({ error: `azione_stock non valida. Valori ammessi: ${azioniValide.join(', ')}` }, { status: 400 })

      const currentStock = await prisma.stockBicicletta.findUnique({
        where: { locationId_biciclettaId: { locationId: parseInt(locationId), biciclettaId: parseInt(biciclettaId) } }
      })

      if (!currentStock) {
        if (azione_stock === 'incrementa') {
          const newStock = await prisma.stockBicicletta.create({
            data: { locationId: parseInt(locationId), biciclettaId: parseInt(biciclettaId), quantita: 1, inManutenzione: 0 }
          })
          return NextResponse.json(newStock)
        }
        return NextResponse.json({ error: 'Stock non trovato' }, { status: 404 })
      }

      let updateData: any = {}
      if (azione_stock === 'incrementa') updateData.quantita = currentStock.quantita + 1
      if (azione_stock === 'riduce') {
        if (currentStock.quantita <= 0) return NextResponse.json({ error: 'Stock già a zero' }, { status: 400 })
        if (currentStock.quantita - 1 < currentStock.inManutenzione) return NextResponse.json({ error: 'Bici in manutenzione occupano tutto lo stock' }, { status: 400 })
        updateData.quantita = currentStock.quantita - 1
      }
      if (azione_stock === 'manutenzione_in') {
        if (currentStock.inManutenzione >= currentStock.quantita) return NextResponse.json({ error: 'Tutte le bici sono già in manutenzione' }, { status: 400 })
        updateData.inManutenzione = currentStock.inManutenzione + 1
      }
      if (azione_stock === 'manutenzione_out') {
        if (currentStock.inManutenzione <= 0) return NextResponse.json({ error: 'Nessuna bici in manutenzione' }, { status: 400 })
        updateData.inManutenzione = currentStock.inManutenzione - 1
      }

      const updatedStock = await prisma.stockBicicletta.update({ where: { id: currentStock.id }, data: updateData })
      return NextResponse.json(updatedStock)
    }

    // ── AGGIUNGI BICI A NEGOZIO ───────────────────────────────────────────────
    if (action === 'aggiungi_bici_negozio') {
      if (user.roleName !== 'ADMIN')
        return NextResponse.json({ error: 'Accesso negato' }, { status: 403 })
      const { locationId, biciclettaId, quantita = 1 } = body
      if (!locationId || !biciclettaId)
        return NextResponse.json({ error: 'locationId e biciclettaId obbligatori' }, { status: 400 })

      const qty = parseInt(quantita)
      if (isNaN(qty) || qty < 1)
        return NextResponse.json({ error: 'quantita deve essere >= 1' }, { status: 400 })

      const bici    = await prisma.bicicletta.findUnique({ where: { id: parseInt(biciclettaId) } })
      const negozio = await prisma.location.findUnique({ where: { id: parseInt(locationId) } })
      if (!bici)    return NextResponse.json({ error: 'Bicicletta non trovata' }, { status: 404 })
      if (!negozio) return NextResponse.json({ error: 'Negozio non trovato' }, { status: 404 })

      const stock = await prisma.stockBicicletta.upsert({
        where:  { locationId_biciclettaId: { locationId: parseInt(locationId), biciclettaId: parseInt(biciclettaId) } },
        update: { quantita: { increment: qty } },
        create: { locationId: parseInt(locationId), biciclettaId: parseInt(biciclettaId), quantita: qty, inManutenzione: 0 },
        include: { bicicletta: { include: { modello: true, tipologie: true, dimensioni: true } } }
      })
      return NextResponse.json(stock)
    }

    // ── AGGIORNA DIMENSIONE ───────────────────────────────────────────────────
    if (action === 'update_dimensione') {
      if (user.roleName !== 'ADMIN')
        return NextResponse.json({ error: 'Accesso negato' }, { status: 403 })
      const { dimensioneId, quantitaElettrico, quantitaMuscolare } = body
      if (!dimensioneId)
        return NextResponse.json({ error: 'dimensioneId obbligatorio' }, { status: 400 })
      const updated = await prisma.dimensione.update({
        where: { id: parseInt(dimensioneId) },
        data: {
          quantitaElettrico: quantitaElettrico !== undefined ? parseInt(quantitaElettrico) : undefined,
          quantitaMuscolare: quantitaMuscolare !== undefined ? parseInt(quantitaMuscolare) : undefined
        }
      })
      return NextResponse.json(updated)
    }

    return NextResponse.json({ error: 'Azione POST non valida' }, { status: 400 })

  } catch (error) {
    console.error('[POST] Errore:', error)
    return NextResponse.json({ error: 'Errore interno del server (POST)' }, { status: 500 })
  }
}