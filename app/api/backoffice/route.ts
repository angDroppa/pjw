import prisma from '@/lib/prisma'
import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth-helper'

// ==========================================
// 1. METODI GET (Lettura Dati & Statistiche)
// ==========================================
export async function GET(req: Request) {
    const user = await requireAuth(req)
  if (!user) return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const action = searchParams.get('action')

  try {
    // --- TASK 1: CARICAMENTO CONFIGURAZIONE GLOBALE ---
    if (action === 'config') {
      const [negozi, accessori, assicurazioni] = await prisma.$transaction([
        prisma.location.findMany({ include: { stocks: { include: { bicicletta: { include: { modello: true } } } } } }),
        prisma.accessorio.findMany(),
        prisma.assicurazione.findMany()
      ])
      return NextResponse.json({ negozi, accessori, assicurazioni })
    }

    // --- TASK 2: OPERAZIONI GIORNALIERE (PRENOTAZIONI FILTRATE) ---
    if (action === 'prenotazioni') {
      const utente = searchParams.get('utente')
      const data = searchParams.get('data')
      const locationId = searchParams.get('locationId')

      const whereClause: any = {}

      if (utente) {
        whereClause.utente = {
          OR: [
            { firstName: { contains: utente, mode: 'insensitive' } },
            { lastName: { contains: utente, mode: 'insensitive' } }
          ]
        }
      }

      if (data) {
        const searchDate = new Date(data)
        whereClause.dataRitiro = {
          gte: new Date(new Date(searchDate).setHours(0, 0, 0, 0)),
          lte: new Date(new Date(searchDate).setHours(23, 59, 59, 999))
        }
      }

      if (locationId) {
        whereClause.locationId = parseInt(locationId)
      }

      const prenotazioni = await prisma.prenotazione.findMany({
        where: whereClause,
        include: {
          utente: { select: { firstName: true, lastName: true, email: true } },
          bicicletta: { include: { modello: true } },
          location: true,
          copertura: true,
          accessori: true
        },
        orderBy: { dataRitiro: 'asc' }
      })
      return NextResponse.json(prenotazioni)
    }

    // --- TASK 4: STATISTICHE & PERFORMANCE ---
    if (action === 'statistiche') {
      if (user.roleName !== 'ADMIN') return NextResponse.json({ error: 'Accesso negato' }, { status: 403 })

      // Filtro opzionale per periodo
      const da = searchParams.get('da')
      const a = searchParams.get('a')

      const periodoClause = da && a
        ? { dataRitiro: { gte: new Date(da), lte: new Date(a) } }
        : {}

      const baseWhere = { NOT: { stato: 'CANCELLED' as const }, ...periodoClause }

      // A. Aggregati globali
      const aggregatiGlobali = await prisma.prenotazione.aggregate({
        _count: { id: true },
        _sum: { totalePagato: true },
        where: baseWhere
      })

      // B. Performance Negozi
      const performanceNegoziRaw = await prisma.prenotazione.groupBy({
        by: ['locationId'],
        _sum: { totalePagato: true },
        where: baseWhere
      })

      const locationIds = performanceNegoziRaw.map(p => p.locationId)
      const infoNegozi = await prisma.location.findMany({
        where: { id: { in: locationIds } },
        select: { id: true, nome: true }
      })

      const shopPerformance = performanceNegoziRaw.map(p => ({
        name: infoNegozi.find(n => n.id === p.locationId)?.nome || `Negozio #${p.locationId}`,
        revenue: p._sum.totalePagato || 0
      }))

      // C. Bici più usate
      const biciPiuUsateRaw = await prisma.prenotazione.groupBy({
        by: ['biciclettaId'],
        _count: { id: true },
        orderBy: { _count: { id: 'desc' } },
        take: 5,
        where: baseWhere
      })

      const biciIds = biciPiuUsateRaw.map(b => b.biciclettaId)
      const infoBici = await prisma.bicicletta.findMany({
        where: { id: { in: biciIds } },
        include: { modello: true }
      })

      const mostUsedBikes = biciPiuUsateRaw.map(b => ({
        model: infoBici.find(i => i.id === b.biciclettaId)?.modello.nome || `Modello #${b.biciclettaId}`,
        rentals: b._count.id
      }))

      return NextResponse.json({
        totalBookings: aggregatiGlobali._count.id,
        totalRevenue: aggregatiGlobali._sum.totalePagato || 0,
        shopPerformance,
        mostUsedBikes,
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
// 2. METODO POST (Scrittura, Modifiche e Aggiornamenti)
// ==========================================
export async function POST(req: Request) {
  const user = await requireAuth(req)
  if (!user) return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })

  const body = await req.json()
  const { action } = body

  try {
    // --- TASK 1a: AGGIORNA CONFIGURAZIONE NEGOZIO ---
    if (action === 'update_config') {
      if (user.roleName !== 'ADMIN') return NextResponse.json({ error: 'Accesso negato' }, { status: 403 })
      const { shopId, prezzoMezzaGiornata, nome, indirizzo } = body

      const updatedLocation = await prisma.location.update({
        where: { id: parseInt(shopId) },
        data: {
          prezzoMezzaGiornata: prezzoMezzaGiornata !== undefined ? parseFloat(prezzoMezzaGiornata) : undefined,
          nome: nome || undefined,
          indirizzo: indirizzo || undefined,
        }
      })
      return NextResponse.json(updatedLocation)
    }

    // --- TASK 1b: AGGIORNA PREZZO/NOME ACCESSORIO ---
    if (action === 'update_accessorio') {
      if (user.roleName !== 'ADMIN') return NextResponse.json({ error: 'Accesso negato' }, { status: 403 })
      const { accessorioId, prezzo, nome } = body

      if (!accessorioId) return NextResponse.json({ error: 'accessorioId obbligatorio' }, { status: 400 })

      const updated = await prisma.accessorio.update({
        where: { id: parseInt(accessorioId) },
        data: {
          prezzo: prezzo !== undefined ? parseFloat(prezzo) : undefined,
          nome: nome || undefined
        }
      })
      return NextResponse.json(updated)
    }

    // --- TASK 1c: AGGIORNA PREZZO/DETTAGLI ASSICURAZIONE ---
    if (action === 'update_assicurazione') {
      if (user.roleName !== 'ADMIN') return NextResponse.json({ error: 'Accesso negato' }, { status: 403 })
      const { assicurazioneId, prezzo, tipo, dettagli } = body

      if (!assicurazioneId) return NextResponse.json({ error: 'assicurazioneId obbligatorio' }, { status: 400 })

      const updated = await prisma.assicurazione.update({
        where: { id: parseInt(assicurazioneId) },
        data: {
          prezzo: prezzo !== undefined ? parseFloat(prezzo) : undefined,
          tipo: tipo || undefined,
          dettagli: dettagli || undefined
        }
      })
      return NextResponse.json(updated)
    }

    // --- TASK 2: CAMBIO STATO PRENOTAZIONE ---
    // stati validi: PENDING | PICKED_UP | RETURNED | LATE | DAMAGED | CANCELLED
    // RETURNED: aggiorna anche lo stock della bici (ripristino disponibilità)
    if (action === 'update_stato_prenotazione') {
      const { prenotazioneId, stato, noteProblemi } = body

      if (!prenotazioneId || !stato) {
        return NextResponse.json({ error: 'prenotazioneId e stato sono obbligatori' }, { status: 400 })
      }

      const statiValidi = ['PENDING', 'PICKED_UP', 'RETURNED', 'LATE', 'DAMAGED', 'CANCELLED']
      if (!statiValidi.includes(stato)) {
        return NextResponse.json({ error: `Stato non valido. Valori ammessi: ${statiValidi.join(', ')}` }, { status: 400 })
      }

      // Se la bici viene restituita, aggiorniamo prenotazione e stock in una transazione
      if (stato === 'RETURNED') {
        const prenotazione = await prisma.prenotazione.findUnique({
          where: { id: parseInt(prenotazioneId) },
          select: { biciclettaId: true, locationId: true, stato: true }
        })

        if (!prenotazione) return NextResponse.json({ error: 'Prenotazione non trovata' }, { status: 404 })

        // Evitiamo doppi resi
        if (prenotazione.stato === 'RETURNED') {
          return NextResponse.json({ error: 'Prenotazione già contrassegnata come restituita' }, { status: 400 })
        }

        const [updatedPrenotazione] = await prisma.$transaction([
          prisma.prenotazione.update({
            where: { id: parseInt(prenotazioneId) },
            data: {
              stato: 'RETURNED',
              noteProblemi: noteProblemi || undefined
            }
          }),
          // Ripristino disponibilità: incrementa quantita nello stock
          prisma.stockBicicletta.updateMany({
            where: {
              locationId: prenotazione.locationId,
              biciclettaId: prenotazione.biciclettaId
            },
            data: {
              quantita: { increment: 1 }
            }
          })
        ])

        return NextResponse.json(updatedPrenotazione)
      }

      // Per tutti gli altri stati, aggiornamento semplice
      const updatedPrenotazione = await prisma.prenotazione.update({
        where: { id: parseInt(prenotazioneId) },
        data: {
          stato: stato,
          noteProblemi: noteProblemi || undefined,
          dataPickUp: stato === 'PICKED_UP' ? new Date() : undefined
        }
      })
      return NextResponse.json(updatedPrenotazione)
    }

    // --- TASK 3: GESTIONE STOCK ---
    // azione_stock: "incrementa" | "riduce" | "manutenzione_in" | "manutenzione_out"
    if (action === 'update_stock') {
      const { locationId, biciclettaId, azione_stock } = body

      if (!locationId || !biciclettaId || !azione_stock) {
        return NextResponse.json({ error: 'locationId, biciclettaId e azione_stock sono obbligatori' }, { status: 400 })
      }

      const azioniValide = ['incrementa', 'riduce', 'manutenzione_in', 'manutenzione_out']
      if (!azioniValide.includes(azione_stock)) {
        return NextResponse.json({ error: `azione_stock non valida. Valori ammessi: ${azioniValide.join(', ')}` }, { status: 400 })
      }

      const currentStock = await prisma.stockBicicletta.findUnique({
        where: {
          locationId_biciclettaId: {
            locationId: parseInt(locationId),
            biciclettaId: parseInt(biciclettaId)
          }
        }
      })

      // Se lo stock non esiste e si vuole incrementare, lo creiamo
      if (!currentStock) {
        if (azione_stock === 'incrementa') {
          const newStock = await prisma.stockBicicletta.create({
            data: {
              locationId: parseInt(locationId),
              biciclettaId: parseInt(biciclettaId),
              quantita: 1,
              inManutenzione: 0
            }
          })
          return NextResponse.json(newStock)
        }
        return NextResponse.json({ error: 'Stock non trovato per questa bici in questo negozio' }, { status: 404 })
      }

      let updateData: any = {}

      if (azione_stock === 'incrementa') {
        updateData.quantita = currentStock.quantita + 1
      }

      if (azione_stock === 'riduce') {
        if (currentStock.quantita <= 0) {
          return NextResponse.json({ error: 'Impossibile ridurre: stock già a zero' }, { status: 400 })
        }
        // Non scendere sotto le bici attualmente in manutenzione
        if (currentStock.quantita - 1 < currentStock.inManutenzione) {
          return NextResponse.json({ error: 'Impossibile ridurre: ci sono bici in manutenzione che occupano tutto lo stock' }, { status: 400 })
        }
        updateData.quantita = currentStock.quantita - 1
      }

      if (azione_stock === 'manutenzione_in') {
        // Non si può mandare in manutenzione più bici di quante se ne possiedono
        if (currentStock.inManutenzione >= currentStock.quantita) {
          return NextResponse.json({ error: 'Impossibile: tutte le bici disponibili sono già in manutenzione' }, { status: 400 })
        }
        updateData.inManutenzione = currentStock.inManutenzione + 1
      }

      if (azione_stock === 'manutenzione_out') {
        if (currentStock.inManutenzione <= 0) {
          return NextResponse.json({ error: 'Nessuna bici attualmente in manutenzione' }, { status: 400 })
        }
        updateData.inManutenzione = currentStock.inManutenzione - 1
      }

      const updatedStock = await prisma.stockBicicletta.update({
        where: { id: currentStock.id },
        data: updateData
      })
      return NextResponse.json(updatedStock)
    }

    return NextResponse.json({ error: 'Azione POST non valida' }, { status: 400 })

  } catch (error) {
    console.error('[POST] Errore:', error)
    return NextResponse.json({ error: 'Errore interno del server (POST)' }, { status: 500 })
  }
}