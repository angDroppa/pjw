import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'
import 'dotenv/config'
import { PrismaClient } from '@/app/generated/prisma/client'
import bcrypt from 'bcryptjs'

const pool = new Pool({ connectionString: process.env.DATABASE_URL })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

async function main() {
  console.log('🌱 Seed in avvio...')

  // ==========================================
  // 1. RUOLI
  // ==========================================
  await prisma.role.upsert({ where: { role: 'ADMIN' },    update: {}, create: { role: 'ADMIN' } })
  await prisma.role.upsert({ where: { role: 'STAFF' },    update: {}, create: { role: 'STAFF' } })
  await prisma.role.upsert({ where: { role: 'CUSTOMER' }, update: {}, create: { role: 'CUSTOMER' } })
  console.log('✅ Ruoli creati')

  // ==========================================
  // 2. STAFF
  // ==========================================
  const pwdStaff = await bcrypt.hash('admin1234', 12)

  await prisma.user.upsert({ where: { email: 'admin@bikerent.com' },            update: {}, create: { firstName: 'Luca',   lastName: 'Ferretti',  email: 'admin@bikerent.com',            password: pwdStaff, roleName: 'ADMIN', verified: true } })
  await prisma.user.upsert({ where: { email: 'staff.milano@bikerent.com' },     update: {}, create: { firstName: 'Chiara', lastName: 'Mantovani', email: 'staff.milano@bikerent.com',     password: pwdStaff, roleName: 'STAFF', verified: true } })
  await prisma.user.upsert({ where: { email: 'staff.roma@bikerent.com' },       update: {}, create: { firstName: 'Davide', lastName: 'Esposito',  email: 'staff.roma@bikerent.com',       password: pwdStaff, roleName: 'STAFF', verified: true } })
  await prisma.user.upsert({ where: { email: 'staff.torino@bikerent.com' },     update: {}, create: { firstName: 'Sara',   lastName: 'Ricci',     email: 'staff.torino@bikerent.com',     password: pwdStaff, roleName: 'STAFF', verified: true } })
  console.log('✅ Staff creato')

  // ==========================================
  // 3. CLIENTI
  // ==========================================
  const pwdCustomer = await bcrypt.hash('changeme123', 10)

  const clientiData = [
    { firstName: 'Mario',      lastName: 'Rossi',      email: 'mario.rossi@gmail.com' },
    { firstName: 'Giulia',     lastName: 'Bianchi',    email: 'giulia.bianchi@yahoo.it' },
    { firstName: 'Alessandro', lastName: 'Verdi',      email: 'ale.verdi@outlook.com' },
    { firstName: 'Francesca',  lastName: 'Colombo',    email: 'fra.colombo@gmail.com' },
    { firstName: 'Lorenzo',    lastName: 'Mancini',    email: 'lore.mancini@libero.it' },
    { firstName: 'Valentina',  lastName: 'Galli',      email: 'vale.galli@gmail.com' },
    { firstName: 'Matteo',     lastName: 'Conti',      email: 'matteo.conti@hotmail.it' },
    { firstName: 'Elena',      lastName: 'Ricci',      email: 'elena.ricci@gmail.com' },
    { firstName: 'Simone',     lastName: 'Bruno',      email: 'simone.bruno@outlook.com' },
    { firstName: 'Marta',      lastName: 'De Luca',    email: 'marta.deluca@gmail.com' },
    { firstName: 'Andrea',     lastName: 'Fontana',    email: 'andrea.fontana@yahoo.com' },
    { firstName: 'Sofia',      lastName: 'Moretti',    email: 'sofia.moretti@gmail.com' },
    { firstName: 'Riccardo',   lastName: 'Ferrari',    email: 'ric.ferrari@libero.it' },
    { firstName: 'Beatrice',   lastName: 'Leone',      email: 'bea.leone@gmail.com' },
    { firstName: 'Filippo',    lastName: 'Marini',     email: 'fil.marini@outlook.com' },
    { firstName: 'Giorgia',    lastName: 'Costa',      email: 'gio.costa@gmail.com' },
    { firstName: 'Marco',      lastName: 'Martinelli', email: 'marco.martinelli@yahoo.it' },
    { firstName: 'Alessia',    lastName: 'Greco',      email: 'alessia.greco@gmail.com' },
    { firstName: 'Nicola',     lastName: 'Barbieri',   email: 'nicola.barbieri@libero.it' },
    { firstName: 'Camilla',    lastName: 'Palumbo',    email: 'camilla.palumbo@gmail.com' },
  ]

  const clienti = await Promise.all(
    clientiData.map(c =>
      prisma.user.upsert({
        where:  { email: c.email },
        update: {},
        create: { ...c, password: pwdCustomer, roleName: 'CUSTOMER', verified: true },
      })
    )
  )
  console.log(`✅ ${clienti.length} clienti creati`)

  // ==========================================
  // 4. LOCATION
  // ==========================================
  const locMilano  = await prisma.location.create({ data: { nome: 'Sede Centrale Milano',          indirizzo: 'Via Dante 14, Milano' } })
  const locRoma    = await prisma.location.create({ data: { nome: 'Roma Termini',                  indirizzo: 'Piazza dei Cinquecento 1, Roma' } })
  const locTorino  = await prisma.location.create({ data: { nome: 'Torino Centro',                 indirizzo: 'Piazza Castello 9, Torino' } })
  const locFirenze = await prisma.location.create({ data: { nome: 'Firenze Santa Maria Novella',   indirizzo: 'Piazza della Stazione 4, Firenze' } })
  console.log('✅ 4 location create')

  // ==========================================
  // 5. ACCESSORI
  // ==========================================
  const accCasco      = await prisma.accessorio.create({ data: { nome: 'Casco di Protezione',          prezzo: 5.0  } })
  const accBorraccia  = await prisma.accessorio.create({ data: { nome: 'Borraccia',                    prezzo: 2.0  } })
  const accSmartphone = await prisma.accessorio.create({ data: { nome: 'Supporto Smartphone',          prezzo: 3.0  } })
  const accLucchetto  = await prisma.accessorio.create({ data: { nome: 'Lucchetto Antifurto',          prezzo: 3.0  } })
  const accLuci       = await prisma.accessorio.create({ data: { nome: 'Luci Anteriori e Posteriori',  prezzo: 4.0  } })
  console.log('✅ 5 accessori creati')

  // ==========================================
  // 6. ASSICURAZIONI
  // ==========================================
  const assBase    = await prisma.assicurazione.create({ data: { tipo: 'Assicurazione Base',     dettagli: 'Copre danni fino a 200 €',                       prezzo: 0.0  } })
  const assEmerg   = await prisma.assicurazione.create({ data: { tipo: 'Servizio di Emergenza',  dettagli: 'Recupero entro 50 km',                            prezzo: 5.0  } })
  const assKasko   = await prisma.assicurazione.create({ data: { tipo: 'Kasko',                  dettagli: 'Copertura completa con danni illimitati + emergenza', prezzo: 12.0 } })
  console.log('✅ 3 assicurazioni create')

  // ==========================================
  // 7. BICICLETTE + SPECIFICHE
  // ==========================================

  function specData(
    sizes: string[],
    prezzoG: number,
    prezzoMG: number,
    altezza: Record<string, { min: number; max: number }>
  ) {
    return sizes.flatMap(size => [
      {
        size,
        alimentazione: 'MUSCOLARE' as const,
        prezzoGiornata: prezzoG,
        prezzoMezzaGiornata: prezzoMG,
        altezzaMin: altezza[size]?.min ?? null,
        altezzaMax: altezza[size]?.max ?? null,
      },
      {
        size,
        alimentazione: 'ELETTRICA' as const,
        prezzoGiornata: prezzoG + 10,
        prezzoMezzaGiornata: prezzoMG + 6,
        altezzaMin: altezza[size]?.min ?? null,
        altezzaMax: altezza[size]?.max ?? null,
      },
    ])
  }

  const altezza: Record<string, { min: number; max: number }> = {
    S:  { min: 150, max: 165 },
    M:  { min: 165, max: 178 },
    L:  { min: 178, max: 190 },
    XL: { min: 190, max: 210 },
  }

  // City Bike
  const bikeCity = await prisma.bicicletta.create({
    data: {
      nome: 'City Bike Classic',
      tipologia: 'CITY',
      specifics: { create: specData(['S', 'M', 'L', 'XL'], 12, 7, altezza) },
    },
    include: { specifics: true },
  })

  // Mountain Bike
  const bikeMTB = await prisma.bicicletta.create({
    data: {
      nome: 'Mountain Bike Trail',
      tipologia: 'MOUNTAIN',
      specifics: { create: specData(['S', 'M', 'L', 'XL'], 16, 9, altezza) },
    },
    include: { specifics: true },
  })

  // Gravel
  const bikeGravel = await prisma.bicicletta.create({
    data: {
      nome: 'Gravel Explorer',
      tipologia: 'GRAVEL',
      specifics: { create: specData(['S', 'M', 'L'], 18, 10, altezza) },
    },
    include: { specifics: true },
  })

  // Road Bike
  const bikeRoad = await prisma.bicicletta.create({
    data: {
      nome: 'Road Bike Pro',
      tipologia: 'ROAD',
      specifics: { create: specData(['S', 'M', 'L'], 20, 12, altezza) },
    },
    include: { specifics: true },
  })

  console.log('✅ 4 biciclette con specifiche create')

  // Helper: trova specifica per bici, taglia e alimentazione
  const spec = (bike: typeof bikeCity, size: string, alim: 'MUSCOLARE' | 'ELETTRICA') =>
    bike.specifics.find(s => s.size === size && s.alimentazione === alim) ?? bike.specifics[0]

  // ==========================================
  // 8. STOCK PER LOCATION
  // ==========================================

  // Milano
  await prisma.biciclettaLocation.createMany({ data: [
    { locationId: locMilano.id, biciclettaSpecificId: spec(bikeCity,   'M', 'MUSCOLARE').id, quantita: 8 },
    { locationId: locMilano.id, biciclettaSpecificId: spec(bikeCity,   'M', 'ELETTRICA').id, quantita: 5 },
    { locationId: locMilano.id, biciclettaSpecificId: spec(bikeMTB,    'M', 'MUSCOLARE').id, quantita: 6 },
    { locationId: locMilano.id, biciclettaSpecificId: spec(bikeMTB,    'M', 'ELETTRICA').id, quantita: 4 },
    { locationId: locMilano.id, biciclettaSpecificId: spec(bikeGravel, 'M', 'MUSCOLARE').id, quantita: 5 },
    { locationId: locMilano.id, biciclettaSpecificId: spec(bikeRoad,   'M', 'MUSCOLARE').id, quantita: 4 },
    { locationId: locMilano.id, biciclettaSpecificId: spec(bikeCity,   'L', 'MUSCOLARE').id, quantita: 4 },
    { locationId: locMilano.id, biciclettaSpecificId: spec(bikeRoad,   'L', 'ELETTRICA').id, quantita: 3 },
  ]})

  // Roma
  await prisma.biciclettaLocation.createMany({ data: [
    { locationId: locRoma.id, biciclettaSpecificId: spec(bikeCity,   'M', 'MUSCOLARE').id, quantita: 10 },
    { locationId: locRoma.id, biciclettaSpecificId: spec(bikeCity,   'M', 'ELETTRICA').id, quantita: 6 },
    { locationId: locRoma.id, biciclettaSpecificId: spec(bikeMTB,    'M', 'MUSCOLARE').id, quantita: 5 },
    { locationId: locRoma.id, biciclettaSpecificId: spec(bikeMTB,    'M', 'ELETTRICA').id, quantita: 3 },
    { locationId: locRoma.id, biciclettaSpecificId: spec(bikeGravel, 'M', 'MUSCOLARE').id, quantita: 4 },
    { locationId: locRoma.id, biciclettaSpecificId: spec(bikeRoad,   'S', 'MUSCOLARE').id, quantita: 3 },
    { locationId: locRoma.id, biciclettaSpecificId: spec(bikeCity,   'L', 'MUSCOLARE').id, quantita: 6 },
    { locationId: locRoma.id, biciclettaSpecificId: spec(bikeGravel, 'L', 'ELETTRICA').id, quantita: 2 },
  ]})

  // Torino
  await prisma.biciclettaLocation.createMany({ data: [
    { locationId: locTorino.id, biciclettaSpecificId: spec(bikeCity,   'S', 'MUSCOLARE').id, quantita: 6 },
    { locationId: locTorino.id, biciclettaSpecificId: spec(bikeCity,   'S', 'ELETTRICA').id, quantita: 3 },
    { locationId: locTorino.id, biciclettaSpecificId: spec(bikeMTB,    'M', 'MUSCOLARE').id, quantita: 5 },
    { locationId: locTorino.id, biciclettaSpecificId: spec(bikeGravel, 'M', 'MUSCOLARE').id, quantita: 4 },
    { locationId: locTorino.id, biciclettaSpecificId: spec(bikeRoad,   'M', 'MUSCOLARE').id, quantita: 3 },
    { locationId: locTorino.id, biciclettaSpecificId: spec(bikeMTB,    'L', 'ELETTRICA').id, quantita: 2 },
  ]})

  // Firenze
  await prisma.biciclettaLocation.createMany({ data: [
    { locationId: locFirenze.id, biciclettaSpecificId: spec(bikeCity,   'M', 'MUSCOLARE').id, quantita: 7 },
    { locationId: locFirenze.id, biciclettaSpecificId: spec(bikeCity,   'M', 'ELETTRICA').id, quantita: 4 },
    { locationId: locFirenze.id, biciclettaSpecificId: spec(bikeMTB,    'S', 'MUSCOLARE').id, quantita: 3 },
    { locationId: locFirenze.id, biciclettaSpecificId: spec(bikeGravel, 'S', 'MUSCOLARE').id, quantita: 3 },
    { locationId: locFirenze.id, biciclettaSpecificId: spec(bikeRoad,   'M', 'MUSCOLARE').id, quantita: 2 },
    { locationId: locFirenze.id, biciclettaSpecificId: spec(bikeCity,   'L', 'ELETTRICA').id, quantita: 3 },
  ]})

  console.log('✅ Stock BiciclettaLocation popolato per 4 negozi')

  // ==========================================
  // 9. GENERA ISTANZE (BiciclettaIstanza)
  // ==========================================

  const stockEntries = await prisma.biciclettaLocation.findMany()
  const istanzaData: { codice: string; specificheBiciclettaId: number; locationId: number; biciclettaLocationId: number }[] = []

  for (const entry of stockEntries) {
    for (let i = 1; i <= entry.quantita; i++) {
      istanzaData.push({
        codice: `BIKE-${entry.biciclettaSpecificId}-${entry.locationId}-${i}`,
        specificheBiciclettaId: entry.biciclettaSpecificId,
        locationId: entry.locationId,
        biciclettaLocationId: entry.id,
      })
    }
  }

  await prisma.biciclettaIstanza.createMany({ data: istanzaData })
  console.log(`✅ ${istanzaData.length} istanze BiciclettaIstanza create`)

  // ==========================================
  // 10. PRENOTAZIONI
  // ==========================================

  interface PrenData {
    dataRitiro:   Date
    oraRitiro:    string
    dataConsegna: Date
    oraConsegna:  string
    stato:        'PENDING' | 'PICKED_UP' | 'RETURNED' | 'LATE'
    totale:       number
    utenteIdx:    number
    specifica:    { id: number }
    location:     { id: number }
    assicurazione:{ id: number }
    accessoriIds: number[]
    note?:        string
  }

  const prenotazioni: PrenData[] = [
    // Maggio 2026
    { dataRitiro: new Date('2026-05-05'), oraRitiro: '09:00', dataConsegna: new Date('2026-05-05'), oraConsegna: '13:00', stato: 'RETURNED', totale: 12.0, utenteIdx: 0,  specifica: spec(bikeCity,   'M', 'MUSCOLARE'), location: locMilano,  assicurazione: assBase, accessoriIds: [accCasco.id] },
    { dataRitiro: new Date('2026-05-06'), oraRitiro: '10:00', dataConsegna: new Date('2026-05-06'), oraConsegna: '18:00', stato: 'RETURNED', totale: 34.0, utenteIdx: 1,  specifica: spec(bikeCity,   'M', 'ELETTRICA'), location: locRoma,    assicurazione: assKasko, accessoriIds: [accCasco.id, accBorraccia.id] },
    { dataRitiro: new Date('2026-05-07'), oraRitiro: '09:00', dataConsegna: new Date('2026-05-07'), oraConsegna: '13:00', stato: 'RETURNED', totale: 18.0, utenteIdx: 2,  specifica: spec(bikeGravel, 'M', 'MUSCOLARE'), location: locTorino,  assicurazione: assBase, accessoriIds: [] },
    { dataRitiro: new Date('2026-05-08'), oraRitiro: '11:00', dataConsegna: new Date('2026-05-08'), oraConsegna: '19:00', stato: 'RETURNED', totale: 36.0, utenteIdx: 3,  specifica: spec(bikeMTB,    'M', 'ELETTRICA'), location: locMilano,  assicurazione: assEmerg, accessoriIds: [accLucchetto.id] },
    { dataRitiro: new Date('2026-05-09'), oraRitiro: '09:00', dataConsegna: new Date('2026-05-09'), oraConsegna: '13:00', stato: 'RETURNED', totale: 16.0, utenteIdx: 4,  specifica: spec(bikeRoad,   'S', 'MUSCOLARE'), location: locFirenze, assicurazione: assBase, accessoriIds: [accCasco.id, accLuci.id] },
    { dataRitiro: new Date('2026-05-10'), oraRitiro: '10:00', dataConsegna: new Date('2026-05-10'), oraConsegna: '18:00', stato: 'RETURNED', totale: 28.0, utenteIdx: 5,  specifica: spec(bikeCity,   'L', 'MUSCOLARE'), location: locRoma,    assicurazione: assEmerg, accessoriIds: [accBorraccia.id] },
    { dataRitiro: new Date('2026-05-12'), oraRitiro: '09:00', dataConsegna: new Date('2026-05-12'), oraConsegna: '13:00', stato: 'RETURNED', totale: 12.0, utenteIdx: 6,  specifica: spec(bikeCity,   'S', 'MUSCOLARE'), location: locTorino,  assicurazione: assBase, accessoriIds: [] },
    { dataRitiro: new Date('2026-05-13'), oraRitiro: '09:00', dataConsegna: new Date('2026-05-14'), oraConsegna: '13:00', stato: 'RETURNED', totale: 59.0, utenteIdx: 7,  specifica: spec(bikeMTB,    'L', 'ELETTRICA'), location: locMilano,  assicurazione: assKasko, accessoriIds: [accCasco.id, accBorraccia.id, accLucchetto.id] },
    { dataRitiro: new Date('2026-05-14'), oraRitiro: '10:00', dataConsegna: new Date('2026-05-14'), oraConsegna: '18:00', stato: 'RETURNED', totale: 22.0, utenteIdx: 8,  specifica: spec(bikeGravel, 'S', 'MUSCOLARE'), location: locFirenze, assicurazione: assBase, accessoriIds: [accLuci.id] },
    { dataRitiro: new Date('2026-05-15'), oraRitiro: '09:00', dataConsegna: new Date('2026-05-15'), oraConsegna: '13:00', stato: 'RETURNED', totale: 17.0, utenteIdx: 9,  specifica: spec(bikeRoad,   'M', 'MUSCOLARE'), location: locMilano,  assicurazione: assBase, accessoriIds: [accCasco.id] },
    { dataRitiro: new Date('2026-05-16'), oraRitiro: '11:00', dataConsegna: new Date('2026-05-17'), oraConsegna: '11:00', stato: 'RETURNED', totale: 48.0, utenteIdx: 10, specifica: spec(bikeCity,   'M', 'ELETTRICA'), location: locRoma,    assicurazione: assKasko, accessoriIds: [accCasco.id, accSmartphone.id] },
    { dataRitiro: new Date('2026-05-17'), oraRitiro: '09:00', dataConsegna: new Date('2026-05-17'), oraConsegna: '13:00', stato: 'PENDING',  totale: 0.0,  utenteIdx: 11, specifica: spec(bikeCity,   'M', 'MUSCOLARE'), location: locTorino,  assicurazione: assBase, accessoriIds: [] },
    { dataRitiro: new Date('2026-05-18'), oraRitiro: '10:00', dataConsegna: new Date('2026-05-18'), oraConsegna: '18:00', stato: 'RETURNED', totale: 30.0, utenteIdx: 12, specifica: spec(bikeMTB,    'L', 'MUSCOLARE'), location: locFirenze, assicurazione: assEmerg, accessoriIds: [accCasco.id, accBorraccia.id] },
    { dataRitiro: new Date('2026-05-19'), oraRitiro: '09:00', dataConsegna: new Date('2026-05-19'), oraConsegna: '13:00', stato: 'RETURNED', totale: 12.0, utenteIdx: 13, specifica: spec(bikeCity,   'S', 'MUSCOLARE'), location: locMilano,  assicurazione: assBase, accessoriIds: [] },
    { dataRitiro: new Date('2026-05-20'), oraRitiro: '10:00', dataConsegna: new Date('2026-05-21'), oraConsegna: '10:00', stato: 'RETURNED', totale: 44.0, utenteIdx: 14, specifica: spec(bikeGravel, 'M', 'ELETTRICA'), location: locRoma,    assicurazione: assEmerg, accessoriIds: [accCasco.id], note: 'Graffi sul telaio, leva freno riparata.' },
    { dataRitiro: new Date('2026-05-21'), oraRitiro: '09:00', dataConsegna: new Date('2026-05-21'), oraConsegna: '13:00', stato: 'RETURNED', totale: 16.0, utenteIdx: 15, specifica: spec(bikeRoad,   'L', 'MUSCOLARE'), location: locTorino,  assicurazione: assBase, accessoriIds: [accLucchetto.id] },
    { dataRitiro: new Date('2026-05-22'), oraRitiro: '11:00', dataConsegna: new Date('2026-05-22'), oraConsegna: '19:00', stato: 'RETURNED', totale: 22.0, utenteIdx: 16, specifica: spec(bikeGravel, 'L', 'MUSCOLARE'), location: locMilano,  assicurazione: assBase, accessoriIds: [accLuci.id] },
    { dataRitiro: new Date('2026-05-23'), oraRitiro: '09:00', dataConsegna: new Date('2026-05-23'), oraConsegna: '13:00', stato: 'PENDING',  totale: 0.0,  utenteIdx: 17, specifica: spec(bikeCity,   'L', 'ELETTRICA'), location: locFirenze, assicurazione: assBase, accessoriIds: [] },
    { dataRitiro: new Date('2026-05-25'), oraRitiro: '10:00', dataConsegna: new Date('2026-05-25'), oraConsegna: '18:00', stato: 'RETURNED', totale: 38.0, utenteIdx: 18, specifica: spec(bikeMTB,    'XL', 'MUSCOLARE'), location: locMilano,  assicurazione: assKasko, accessoriIds: [accCasco.id, accBorraccia.id] },
    { dataRitiro: new Date('2026-05-26'), oraRitiro: '09:00', dataConsegna: new Date('2026-05-26'), oraConsegna: '13:00', stato: 'RETURNED', totale: 15.0, utenteIdx: 19, specifica: spec(bikeCity,   'XL', 'MUSCOLARE'), location: locRoma,    assicurazione: assBase, accessoriIds: [] },
    { dataRitiro: new Date('2026-05-27'), oraRitiro: '09:00', dataConsegna: new Date('2026-05-28'), oraConsegna: '09:00', stato: 'LATE',     totale: 52.0, utenteIdx: 0,  specifica: spec(bikeMTB,    'S', 'MUSCOLARE'), location: locTorino,  assicurazione: assEmerg, accessoriIds: [accCasco.id, accLucchetto.id], note: 'Cliente bloccato in autostrada, rientro in serata.' },
    { dataRitiro: new Date('2026-05-28'), oraRitiro: '10:00', dataConsegna: new Date('2026-05-28'), oraConsegna: '14:00', stato: 'RETURNED', totale: 14.0, utenteIdx: 1,  specifica: spec(bikeCity,   'M', 'MUSCOLARE'), location: locFirenze, assicurazione: assBase, accessoriIds: [accBorraccia.id] },
    { dataRitiro: new Date('2026-05-29'), oraRitiro: '11:00', dataConsegna: new Date('2026-05-30'), oraConsegna: '11:00', stato: 'RETURNED', totale: 51.0, utenteIdx: 2,  specifica: spec(bikeCity,   'M', 'ELETTRICA'), location: locMilano,  assicurazione: assKasko, accessoriIds: [accCasco.id, accSmartphone.id] },
    { dataRitiro: new Date('2026-05-30'), oraRitiro: '09:00', dataConsegna: new Date('2026-05-30'), oraConsegna: '13:00', stato: 'RETURNED', totale: 18.0, utenteIdx: 3,  specifica: spec(bikeGravel, 'M', 'MUSCOLARE'), location: locRoma,    assicurazione: assBase, accessoriIds: [] },
    { dataRitiro: new Date('2026-05-31'), oraRitiro: '10:00', dataConsegna: new Date('2026-05-31'), oraConsegna: '18:00', stato: 'RETURNED', totale: 27.0, utenteIdx: 4,  specifica: spec(bikeRoad,   'M', 'MUSCOLARE'), location: locMilano,  assicurazione: assEmerg, accessoriIds: [accCasco.id], note: 'Foratura e sellino rotto durante caduta.' },

    // Giugno 2026
    { dataRitiro: new Date('2026-06-01'), oraRitiro: '09:00', dataConsegna: new Date('2026-06-01'), oraConsegna: '13:00', stato: 'RETURNED',  totale: 20.0, utenteIdx: 5,  specifica: spec(bikeRoad,   'S', 'MUSCOLARE'), location: locTorino,  assicurazione: assBase, accessoriIds: [accCasco.id] },
    { dataRitiro: new Date('2026-06-01'), oraRitiro: '10:00', dataConsegna: new Date('2026-06-02'), oraConsegna: '10:00', stato: 'RETURNED',  totale: 44.0, utenteIdx: 6,  specifica: spec(bikeCity,   'M', 'ELETTRICA'), location: locRoma,    assicurazione: assKasko, accessoriIds: [accCasco.id, accBorraccia.id] },
    { dataRitiro: new Date('2026-06-02'), oraRitiro: '09:00', dataConsegna: new Date('2026-06-02'), oraConsegna: '13:00', stato: 'RETURNED',  totale: 12.0, utenteIdx: 7,  specifica: spec(bikeCity,   'S', 'MUSCOLARE'), location: locFirenze, assicurazione: assBase, accessoriIds: [] },
    { dataRitiro: new Date('2026-06-02'), oraRitiro: '11:00', dataConsegna: new Date('2026-06-03'), oraConsegna: '11:00', stato: 'RETURNED',  totale: 37.0, utenteIdx: 8,  specifica: spec(bikeMTB,    'M', 'MUSCOLARE'), location: locMilano,  assicurazione: assEmerg, accessoriIds: [accLucchetto.id, accLuci.id] },
    { dataRitiro: new Date('2026-06-03'), oraRitiro: '09:00', dataConsegna: new Date('2026-06-03'), oraConsegna: '13:00', stato: 'RETURNED',  totale: 18.0, utenteIdx: 9,  specifica: spec(bikeGravel, 'S', 'MUSCOLARE'), location: locTorino,  assicurazione: assBase, accessoriIds: [accCasco.id] },
    { dataRitiro: new Date('2026-06-03'), oraRitiro: '10:00', dataConsegna: new Date('2026-06-05'), oraConsegna: '10:00', stato: 'PICKED_UP', totale: 52.0, utenteIdx: 10, specifica: spec(bikeCity,   'M', 'MUSCOLARE'), location: locRoma,    assicurazione: assKasko, accessoriIds: [accCasco.id, accBorraccia.id, accSmartphone.id] },
    { dataRitiro: new Date('2026-06-03'), oraRitiro: '11:00', dataConsegna: new Date('2026-06-04'), oraConsegna: '11:00', stato: 'PICKED_UP', totale: 30.0, utenteIdx: 11, specifica: spec(bikeCity,   'M', 'ELETTRICA'), location: locFirenze, assicurazione: assEmerg, accessoriIds: [accCasco.id] },
    { dataRitiro: new Date('2026-06-04'), oraRitiro: '09:00', dataConsegna: new Date('2026-06-04'), oraConsegna: '13:00', stato: 'PENDING',   totale: 23.0, utenteIdx: 12, specifica: spec(bikeMTB,    'S', 'MUSCOLARE'), location: locMilano,  assicurazione: assBase, accessoriIds: [accCasco.id, accLucchetto.id] },
    { dataRitiro: new Date('2026-06-04'), oraRitiro: '09:00', dataConsegna: new Date('2026-06-04'), oraConsegna: '13:00', stato: 'PENDING',   totale: 12.0, utenteIdx: 13, specifica: spec(bikeCity,   'S', 'MUSCOLARE'), location: locTorino,  assicurazione: assBase, accessoriIds: [] },
    { dataRitiro: new Date('2026-06-04'), oraRitiro: '10:00', dataConsegna: new Date('2026-06-04'), oraConsegna: '18:00', stato: 'PENDING',   totale: 34.0, utenteIdx: 14, specifica: spec(bikeMTB,    'L', 'MUSCOLARE'), location: locRoma,    assicurazione: assKasko, accessoriIds: [accCasco.id, accBorraccia.id] },
    { dataRitiro: new Date('2026-06-04'), oraRitiro: '10:00', dataConsegna: new Date('2026-06-05'), oraConsegna: '10:00', stato: 'PENDING',   totale: 22.0, utenteIdx: 15, specifica: spec(bikeGravel, 'M', 'MUSCOLARE'), location: locFirenze, assicurazione: assEmerg, accessoriIds: [accLuci.id] },
    { dataRitiro: new Date('2026-06-04'), oraRitiro: '11:00', dataConsegna: new Date('2026-06-04'), oraConsegna: '15:00', stato: 'PICKED_UP', totale: 16.0, utenteIdx: 16, specifica: spec(bikeRoad,   'M', 'MUSCOLARE'), location: locMilano,  assicurazione: assBase, accessoriIds: [accCasco.id] },
    { dataRitiro: new Date('2026-06-05'), oraRitiro: '09:00', dataConsegna: new Date('2026-06-05'), oraConsegna: '13:00', stato: 'PENDING',   totale: 12.0, utenteIdx: 17, specifica: spec(bikeCity,   'M', 'MUSCOLARE'), location: locMilano,  assicurazione: assBase, accessoriIds: [] },
    { dataRitiro: new Date('2026-06-05'), oraRitiro: '10:00', dataConsegna: new Date('2026-06-06'), oraConsegna: '10:00', stato: 'PENDING',   totale: 46.0, utenteIdx: 18, specifica: spec(bikeMTB,    'L', 'ELETTRICA'), location: locRoma,    assicurazione: assKasko, accessoriIds: [accCasco.id, accBorraccia.id, accLucchetto.id] },
    { dataRitiro: new Date('2026-06-06'), oraRitiro: '09:00', dataConsegna: new Date('2026-06-06'), oraConsegna: '13:00', stato: 'PENDING',   totale: 13.0, utenteIdx: 19, specifica: spec(bikeCity,   'L', 'MUSCOLARE'), location: locTorino,  assicurazione: assBase, accessoriIds: [] },
  ]

  // Recupera tutte le istanze create per assegnarle alle prenotazioni
  const tutteIstanze = await prisma.biciclettaIstanza.findMany({
    include: {
      specificheBicicletta: { include: { bicicletta: true } },
    },
    orderBy: { id: 'asc' },
  })

  // Mappa: (specificaId, locationId) → istanze disponibili
  const istanzePerLocation = new Map<string, typeof tutteIstanze>()
  for (const ist of tutteIstanze) {
    const key = `${ist.specificheBiciclettaId}-${ist.locationId}`
    if (!istanzePerLocation.has(key)) istanzePerLocation.set(key, [])
    istanzePerLocation.get(key)!.push(ist)
  }

  // Contatori per tenere traccia di quale istanza assegnare per ogni (specifica, location)
  const allocCounters = new Map<string, number>()

  function getIstanza(specificaId: number, locationId: number) {
    const key = `${specificaId}-${locationId}`
    const arr = istanzePerLocation.get(key)
    if (!arr || arr.length === 0) return null
    const idx = allocCounters.get(key) ?? 0
    const ist = arr[idx % arr.length]
    allocCounters.set(key, idx + 1)
    return ist
  }

  for (const p of prenotazioni) {
    const istanza = getIstanza(p.specifica.id, p.location.id)
    const occupata = p.stato !== 'RETURNED'
    const pren = await prisma.prenotazione.create({
      data: {
        dataRitiro:   p.dataRitiro,
        oraRitiro:    p.oraRitiro,
        dataConsegna: p.dataConsegna,
        oraConsegna:  p.oraConsegna,
        stato:        p.stato,
        totalePagato: p.totale,
        note:         p.note,
        utenteId:     clienti[p.utenteIdx].id,
        biciclettaId: p.specifica.id,
        biciclettaIstanzaId: istanza?.id ?? null,
        locationId:   p.location.id,
        coperturaId:  p.assicurazione.id,
      },
    })

    if (istanza && occupata) {
      await prisma.biciclettaIstanza.update({
        where: { id: istanza.id },
        data: {
          occupata: true,
          occupataDa: p.dataRitiro,
          occupataA: p.dataConsegna,
        },
      })
    }

    if (p.accessoriIds.length > 0) {
      await prisma.accessorioPrenotazione.createMany({
        data: p.accessoriIds.map(accId => ({
          accessorioId:   accId,
          prenotazioneId: pren.id,
        })),
      })
    }
  }

  console.log(`✅ ${prenotazioni.length} prenotazioni create`)
  console.log('')
  console.log('🏁 Seed completato!')
  console.log('   Admin  → admin@bikerent.com / admin1234')
  console.log('   Clienti → password: changeme123')
}

main()
  .catch(e => { console.error('❌ Errore seed:', e); process.exit(1) })
  .finally(() => prisma.$disconnect())
