import prisma from '@/lib/prisma'

export async function calcolaDisponibilita(
  specificheBiciclettaId: number,
  locationId: number,
  dataRitiro: Date,
  oraRitiro: string,
  dataConsegna: Date,
  oraConsegna: string,
) {
  const pickup = new Date(dataRitiro)
  const [rh, rm] = oraRitiro.split(':').map(Number)
  pickup.setHours(rh, rm, 0, 0)

  const ret = new Date(dataConsegna)
  const [ch, cm] = oraConsegna.split(':').map(Number)
  ret.setHours(ch, cm, 0, 0)

  const stock = await prisma.biciclettaLocation.findUnique({
    where: {
      locationId_biciclettaSpecificId: {
        locationId,
        biciclettaSpecificId: specificheBiciclettaId,
      },
    },
    include: {
      istanze: {
        select: { id: true },
      },
    },
  })

  if (!stock) return { totale: 0, disponibili: 0, istanzeTotali: 0, istanzeDisponibili: 0 }

  const istanzeTotali = stock.istanze.length

  // Se non ci sono istanze, usa il vecchio metodo basato su stock.quantita
  if (istanzeTotali === 0) {
    const prenotate = await prisma.prenotazione.count({
      where: {
        biciclettaId: specificheBiciclettaId,
        locationId,
        stato: { not: 'RETURNED' },
        dataRitiro: { lte: ret },
        dataConsegna: { gte: pickup },
      },
    })
    return {
      totale: stock.quantita,
      disponibili: Math.max(0, stock.quantita - prenotate),
      istanzeTotali: 0,
      istanzeDisponibili: Math.max(0, stock.quantita - prenotate),
    }
  }

  const istanzaIds = stock.istanze.map(i => i.id)

  const prenotazioniSovrapposte = await prisma.prenotazione.findMany({
    where: {
      biciclettaIstanzaId: { in: istanzaIds },
      stato: { not: 'RETURNED' },
      dataRitiro: { lte: ret },
      dataConsegna: { gte: pickup },
    },
    select: { biciclettaIstanzaId: true },
  })

  const istanzaSovrapposte = new Set(prenotazioniSovrapposte.map(p => p.biciclettaIstanzaId))
  const istanzeDisponibili = istanzeTotali - istanzaSovrapposte.size

  return {
    totale: stock.quantita,
    disponibili: istanzeDisponibili,
    istanzeTotali,
    istanzeDisponibili,
  }
}

export async function assegnaIstanza(
  specificheBiciclettaId: number,
  locationId: number,
  dataRitiro: Date,
  oraRitiro: string,
  dataConsegna: Date,
  oraConsegna: string,
) {
  const result = await calcolaDisponibilita(
    specificheBiciclettaId,
    locationId,
    dataRitiro,
    oraRitiro,
    dataConsegna,
    oraConsegna,
  )

  if (result.disponibili <= 0) return null

  const pickup = new Date(dataRitiro)
  const [rh, rm] = oraRitiro.split(':').map(Number)
  pickup.setHours(rh, rm, 0, 0)

  const ret = new Date(dataConsegna)
  const [ch, cm] = oraConsegna.split(':').map(Number)
  ret.setHours(ch, cm, 0, 0)

  const stock = await prisma.biciclettaLocation.findUnique({
    where: {
      locationId_biciclettaSpecificId: {
        locationId,
        biciclettaSpecificId: specificheBiciclettaId,
      },
    },
    include: { istanze: true },
  })

  if (!stock || stock.istanze.length === 0) {
    // Senza istanze, permetti comunque la prenotazione (metodo legacy)
    return null
  }

  const prenotate = await prisma.prenotazione.findMany({
    where: {
      biciclettaIstanzaId: { in: stock.istanze.map(i => i.id) },
      stato: { not: 'RETURNED' },
      dataRitiro: { lte: ret },
      dataConsegna: { gte: pickup },
    },
    select: { biciclettaIstanzaId: true },
  })
  const prenotateIds = new Set(prenotate.map(p => p.biciclettaIstanzaId))

  const istanzaLibera = stock.istanze.find(i => !prenotateIds.has(i.id))
  if (!istanzaLibera) return null

  await prisma.biciclettaIstanza.update({
    where: { id: istanzaLibera.id },
    data: {
      occupata: true,
      occupataDa: pickup,
      occupataA: ret,
    },
  })

  return istanzaLibera
}
