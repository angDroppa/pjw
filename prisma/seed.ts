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

  await prisma.user.upsert({ where: { email: 'admin@bikerent.com' },            update: {}, create: { firstName: 'Luca',   lastName: 'Ferretti',  email: 'admin@bikerent.com',            password: pwdStaff, roleName: 'ADMIN' } })
  await prisma.user.upsert({ where: { email: 'staff.milano@bikerent.com' },     update: {}, create: { firstName: 'Chiara', lastName: 'Mantovani', email: 'staff.milano@bikerent.com',     password: pwdStaff, roleName: 'STAFF' } })
  await prisma.user.upsert({ where: { email: 'staff.roma@bikerent.com' },       update: {}, create: { firstName: 'Davide', lastName: 'Esposito',  email: 'staff.roma@bikerent.com',       password: pwdStaff, roleName: 'STAFF' } })
  await prisma.user.upsert({ where: { email: 'staff.torino@bikerent.com' },     update: {}, create: { firstName: 'Sara',   lastName: 'Ricci',     email: 'staff.torino@bikerent.com',     password: pwdStaff, roleName: 'STAFF' } })
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
        create: { ...c, password: pwdCustomer, roleName: 'CUSTOMER' },
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
  const accBorsa      = await prisma.accessorio.create({ data: { nome: 'Borsa Laterale Impermeabile',  prezzo: 7.0  } })
  const accSeggiolino = await prisma.accessorio.create({ data: { nome: 'Seggiolino Bimbo',             prezzo: 10.0 } })
  const accLucchetto  = await prisma.accessorio.create({ data: { nome: 'Lucchetto Antifurto',          prezzo: 3.0  } })
  const accPompa      = await prisma.accessorio.create({ data: { nome: 'Kit Riparazione Pneumatici',   prezzo: 4.0  } })
  console.log('✅ 5 accessori creati')

  // ==========================================
  // 6. ASSICURAZIONI
  // ==========================================
  const assBase  = await prisma.assicurazione.create({ data: { tipo: 'Base',         dettagli: 'Copertura responsabilità civile verso terzi',    prezzo: 0.0  } })
  const assMedio = await prisma.assicurazione.create({ data: { tipo: 'Standard',     dettagli: 'Copertura danni accidentali con franchigia 50€', prezzo: 6.0  } })
  const assKasko = await prisma.assicurazione.create({ data: { tipo: 'Kasko Totale', dettagli: 'Zero franchigia su furto e danni vandalici',      prezzo: 12.0 } })
  console.log('✅ 3 assicurazioni create')

  // ==========================================
  // 7. BICICLETTE + SPECIFICHE
  //    Nuovo schema: Bicicletta { type } + SpecificheBicicletta { size, price }
  //    Niente Modello / Tipologia / Dimensione
  // ==========================================

  // Elettriche
  const bikeTrekE = await prisma.bicicletta.create({
    data: {
      type: 'Trek PowerFly E — Elettrica',
      specifics: { create: [
        { size: 'S',  price: 28.0 },
        { size: 'M',  price: 28.0 },
        { size: 'L',  price: 28.0 },
        { size: 'XL', price: 30.0 },
      ]},
    },
    include: { specifics: true },
  })

  const bikeSpecialized = await prisma.bicicletta.create({
    data: {
      type: 'Specialized Turbo Vado — Elettrica',
      specifics: { create: [
        { size: 'S', price: 26.0 },
        { size: 'M', price: 26.0 },
        { size: 'L', price: 26.0 },
      ]},
    },
    include: { specifics: true },
  })

  const bikeGiantE = await prisma.bicicletta.create({
    data: {
      type: 'Giant Explore E+ — Elettrica',
      specifics: { create: [
        { size: 'M', price: 25.0 },
        { size: 'L', price: 25.0 },
      ]},
    },
    include: { specifics: true },
  })

  // Muscolari
  const bikeCity = await prisma.bicicletta.create({
    data: {
      type: 'City Bike Classic — Muscolare',
      specifics: { create: [
        { size: 'S',  price: 14.0 },
        { size: 'M',  price: 14.0 },
        { size: 'L',  price: 14.0 },
        { size: 'XL', price: 15.0 },
      ]},
    },
    include: { specifics: true },
  })

  const bikeScott = await prisma.bicicletta.create({
    data: {
      type: 'Scott Speedster Gravel — Muscolare',
      specifics: { create: [
        { size: 'S', price: 18.0 },
        { size: 'M', price: 18.0 },
        { size: 'L', price: 18.0 },
      ]},
    },
    include: { specifics: true },
  })

  const bikeBianchi = await prisma.bicicletta.create({
    data: {
      type: 'Bianchi C-Sport — Muscolare',
      specifics: { create: [
        { size: 'S', price: 16.0 },
        { size: 'M', price: 16.0 },
        { size: 'L', price: 16.0 },
      ]},
    },
    include: { specifics: true },
  })

  console.log('✅ 6 biciclette con specifiche create')

  // Helper: prende la specifica per taglia, fallback alla prima disponibile
  const spec = (bike: typeof bikeTrekE, size: string) =>
    bike.specifics.find(s => s.size === size) ?? bike.specifics[0]

  // ==========================================
  // 8. STOCK PER LOCATION (BiciclettaLocation)
  //    numberE = unità elettriche, numberM = unità muscolari
  //    Per semplicità: elettriche → numberE > 0, muscolari → numberM > 0
  // ==========================================

  // Milano
  await prisma.biciclettaLocation.createMany({ data: [
    { locationId: locMilano.id, biciclettaSpecificId: spec(bikeTrekE,       'M').id, numberE: 10, numberM: 0 },
    { locationId: locMilano.id, biciclettaSpecificId: spec(bikeSpecialized, 'M').id, numberE: 8,  numberM: 0 },
    { locationId: locMilano.id, biciclettaSpecificId: spec(bikeGiantE,      'M').id, numberE: 6,  numberM: 0 },
    { locationId: locMilano.id, biciclettaSpecificId: spec(bikeCity,        'M').id, numberE: 0,  numberM: 20 },
    { locationId: locMilano.id, biciclettaSpecificId: spec(bikeScott,       'M').id, numberE: 0,  numberM: 15 },
    { locationId: locMilano.id, biciclettaSpecificId: spec(bikeBianchi,     'M').id, numberE: 0,  numberM: 12 },
  ]})

  // Roma
  await prisma.biciclettaLocation.createMany({ data: [
    { locationId: locRoma.id, biciclettaSpecificId: spec(bikeTrekE,       'M').id, numberE: 8,  numberM: 0 },
    { locationId: locRoma.id, biciclettaSpecificId: spec(bikeSpecialized, 'M').id, numberE: 7,  numberM: 0 },
    { locationId: locRoma.id, biciclettaSpecificId: spec(bikeGiantE,      'L').id, numberE: 5,  numberM: 0 },
    { locationId: locRoma.id, biciclettaSpecificId: spec(bikeCity,        'M').id, numberE: 0,  numberM: 18 },
    { locationId: locRoma.id, biciclettaSpecificId: spec(bikeScott,       'M').id, numberE: 0,  numberM: 8  },
    { locationId: locRoma.id, biciclettaSpecificId: spec(bikeBianchi,     'M').id, numberE: 0,  numberM: 10 },
  ]})

  // Torino
  await prisma.biciclettaLocation.createMany({ data: [
    { locationId: locTorino.id, biciclettaSpecificId: spec(bikeTrekE,       'S').id, numberE: 5,  numberM: 0 },
    { locationId: locTorino.id, biciclettaSpecificId: spec(bikeSpecialized, 'S').id, numberE: 4,  numberM: 0 },
    { locationId: locTorino.id, biciclettaSpecificId: spec(bikeCity,        'M').id, numberE: 0,  numberM: 16 },
    { locationId: locTorino.id, biciclettaSpecificId: spec(bikeScott,       'L').id, numberE: 0,  numberM: 12 },
    { locationId: locTorino.id, biciclettaSpecificId: spec(bikeBianchi,     'M').id, numberE: 0,  numberM: 8  },
  ]})

  // Firenze
  await prisma.biciclettaLocation.createMany({ data: [
    { locationId: locFirenze.id, biciclettaSpecificId: spec(bikeTrekE,   'L').id, numberE: 6,  numberM: 0 },
    { locationId: locFirenze.id, biciclettaSpecificId: spec(bikeGiantE,  'M').id, numberE: 4,  numberM: 0 },
    { locationId: locFirenze.id, biciclettaSpecificId: spec(bikeCity,    'S').id, numberE: 0,  numberM: 14 },
    { locationId: locFirenze.id, biciclettaSpecificId: spec(bikeBianchi, 'S').id, numberE: 0,  numberM: 6  },
  ]})

  console.log('✅ Stock BiciclettaLocation popolato per 4 negozi')

  // ==========================================
  // 9. PRENOTAZIONI
  //    - biciclettaId ora punta a SpecificheBicicletta.id
  //    - dataRitiro + oraRitiro separati (Date + String)
  //    - dataConsegna + oraConsegna separati
  //    - StatoPrenotazione: PENDING | PICKED_UP | RETURNED | LATE
  //      (DAMAGED e CANCELLED non esistono nel nuovo enum → mappati su RETURNED/PENDING)
  //    - Accessori tramite AccessorioPrenotazione esplicita
  // ==========================================

  type StatoPren = 'PENDING' | 'PICKED_UP' | 'RETURNED' | 'LATE'

  interface PrenData {
    dataRitiro:   Date
    oraRitiro:    string
    dataConsegna: Date
    oraConsegna:  string
    stato:        StatoPren
    totale:       number
    utenteIdx:    number
    specifica:    { id: number }
    location:     { id: number }
    assicurazione:{ id: number }
    accessoriIds: number[]
    note?:        string
  }

  const prenotazioni: PrenData[] = [
    // ── MAGGIO 2026 ───────────────────────────────────────────────────────────
    { dataRitiro: new Date('2026-05-05'), oraRitiro: '09:00', dataConsegna: new Date('2026-05-05'), oraConsegna: '13:00', stato: 'RETURNED', totale: 21.0, utenteIdx: 0,  specifica: spec(bikeCity,       'M'), location: locMilano,  assicurazione: assBase,  accessoriIds: [accCasco.id] },
    { dataRitiro: new Date('2026-05-06'), oraRitiro: '10:00', dataConsegna: new Date('2026-05-06'), oraConsegna: '18:00', stato: 'RETURNED', totale: 44.0, utenteIdx: 1,  specifica: spec(bikeTrekE,      'M'), location: locRoma,    assicurazione: assKasko, accessoriIds: [accCasco.id, accBorsa.id] },
    { dataRitiro: new Date('2026-05-07'), oraRitiro: '09:00', dataConsegna: new Date('2026-05-07'), oraConsegna: '13:00', stato: 'RETURNED', totale: 18.0, utenteIdx: 2,  specifica: spec(bikeScott,      'M'), location: locTorino,  assicurazione: assBase,  accessoriIds: [] },
    { dataRitiro: new Date('2026-05-08'), oraRitiro: '11:00', dataConsegna: new Date('2026-05-08'), oraConsegna: '19:00', stato: 'RETURNED', totale: 52.0, utenteIdx: 3,  specifica: spec(bikeSpecialized,'M'), location: locMilano,  assicurazione: assMedio, accessoriIds: [accLucchetto.id] },
    { dataRitiro: new Date('2026-05-09'), oraRitiro: '09:00', dataConsegna: new Date('2026-05-09'), oraConsegna: '13:00', stato: 'RETURNED', totale: 29.0, utenteIdx: 4,  specifica: spec(bikeBianchi,    'S'), location: locFirenze, assicurazione: assBase,  accessoriIds: [accCasco.id, accPompa.id] },
    { dataRitiro: new Date('2026-05-10'), oraRitiro: '10:00', dataConsegna: new Date('2026-05-10'), oraConsegna: '18:00', stato: 'RETURNED', totale: 38.0, utenteIdx: 5,  specifica: spec(bikeCity,       'L'), location: locRoma,    assicurazione: assMedio, accessoriIds: [accBorsa.id] },
    { dataRitiro: new Date('2026-05-12'), oraRitiro: '09:00', dataConsegna: new Date('2026-05-12'), oraConsegna: '13:00', stato: 'RETURNED', totale: 16.0, utenteIdx: 6,  specifica: spec(bikeCity,       'S'), location: locTorino,  assicurazione: assBase,  accessoriIds: [] },
    { dataRitiro: new Date('2026-05-13'), oraRitiro: '09:00', dataConsegna: new Date('2026-05-14'), oraConsegna: '13:00', stato: 'RETURNED', totale: 67.0, utenteIdx: 7,  specifica: spec(bikeTrekE,      'L'), location: locMilano,  assicurazione: assKasko, accessoriIds: [accCasco.id, accBorsa.id, accLucchetto.id] },
    { dataRitiro: new Date('2026-05-14'), oraRitiro: '10:00', dataConsegna: new Date('2026-05-14'), oraConsegna: '18:00', stato: 'RETURNED', totale: 31.0, utenteIdx: 8,  specifica: spec(bikeScott,      'S'), location: locFirenze, assicurazione: assBase,  accessoriIds: [accPompa.id] },
    { dataRitiro: new Date('2026-05-15'), oraRitiro: '09:00', dataConsegna: new Date('2026-05-15'), oraConsegna: '13:00', stato: 'RETURNED', totale: 24.0, utenteIdx: 9,  specifica: spec(bikeBianchi,    'M'), location: locMilano,  assicurazione: assBase,  accessoriIds: [accCasco.id] },
    { dataRitiro: new Date('2026-05-16'), oraRitiro: '11:00', dataConsegna: new Date('2026-05-17'), oraConsegna: '11:00', stato: 'RETURNED', totale: 58.0, utenteIdx: 10, specifica: spec(bikeGiantE,     'M'), location: locRoma,    assicurazione: assKasko, accessoriIds: [accCasco.id, accSeggiolino.id] },
    { dataRitiro: new Date('2026-05-17'), oraRitiro: '09:00', dataConsegna: new Date('2026-05-17'), oraConsegna: '13:00', stato: 'PENDING',  totale: 0.0,  utenteIdx: 11, specifica: spec(bikeCity,       'M'), location: locTorino,  assicurazione: assBase,  accessoriIds: [] },
    { dataRitiro: new Date('2026-05-18'), oraRitiro: '10:00', dataConsegna: new Date('2026-05-18'), oraConsegna: '18:00', stato: 'RETURNED', totale: 45.0, utenteIdx: 12, specifica: spec(bikeSpecialized,'L'), location: locFirenze, assicurazione: assMedio, accessoriIds: [accCasco.id, accBorsa.id] },
    { dataRitiro: new Date('2026-05-19'), oraRitiro: '09:00', dataConsegna: new Date('2026-05-19'), oraConsegna: '13:00', stato: 'RETURNED', totale: 19.0, utenteIdx: 13, specifica: spec(bikeCity,       'S'), location: locMilano,  assicurazione: assBase,  accessoriIds: [] },
    { dataRitiro: new Date('2026-05-20'), oraRitiro: '10:00', dataConsegna: new Date('2026-05-21'), oraConsegna: '10:00', stato: 'RETURNED', totale: 54.0, utenteIdx: 14, specifica: spec(bikeTrekE,      'S'), location: locRoma,    assicurazione: assMedio, accessoriIds: [accCasco.id], note: 'Graffi sul telaio, leva freno riparata.' },
    { dataRitiro: new Date('2026-05-21'), oraRitiro: '09:00', dataConsegna: new Date('2026-05-21'), oraConsegna: '13:00', stato: 'RETURNED', totale: 22.0, utenteIdx: 15, specifica: spec(bikeBianchi,    'L'), location: locTorino,  assicurazione: assBase,  accessoriIds: [accLucchetto.id] },
    { dataRitiro: new Date('2026-05-22'), oraRitiro: '11:00', dataConsegna: new Date('2026-05-22'), oraConsegna: '19:00', stato: 'RETURNED', totale: 36.0, utenteIdx: 16, specifica: spec(bikeScott,      'L'), location: locMilano,  assicurazione: assBase,  accessoriIds: [accPompa.id] },
    { dataRitiro: new Date('2026-05-23'), oraRitiro: '09:00', dataConsegna: new Date('2026-05-23'), oraConsegna: '13:00', stato: 'PENDING',  totale: 0.0,  utenteIdx: 17, specifica: spec(bikeGiantE,     'L'), location: locFirenze, assicurazione: assBase,  accessoriIds: [] },
    { dataRitiro: new Date('2026-05-25'), oraRitiro: '10:00', dataConsegna: new Date('2026-05-25'), oraConsegna: '18:00', stato: 'RETURNED', totale: 48.0, utenteIdx: 18, specifica: spec(bikeTrekE,      'XL'),location: locMilano,  assicurazione: assKasko, accessoriIds: [accCasco.id, accBorsa.id] },
    { dataRitiro: new Date('2026-05-26'), oraRitiro: '09:00', dataConsegna: new Date('2026-05-26'), oraConsegna: '13:00', stato: 'RETURNED', totale: 17.0, utenteIdx: 19, specifica: spec(bikeCity,       'XL'),location: locRoma,    assicurazione: assBase,  accessoriIds: [] },
    { dataRitiro: new Date('2026-05-27'), oraRitiro: '09:00', dataConsegna: new Date('2026-05-28'), oraConsegna: '09:00', stato: 'LATE',     totale: 72.0, utenteIdx: 0,  specifica: spec(bikeSpecialized,'S'), location: locTorino,  assicurazione: assMedio, accessoriIds: [accCasco.id, accLucchetto.id], note: 'Cliente bloccato in autostrada, rientro in serata.' },
    { dataRitiro: new Date('2026-05-28'), oraRitiro: '10:00', dataConsegna: new Date('2026-05-28'), oraConsegna: '14:00', stato: 'RETURNED', totale: 26.0, utenteIdx: 1,  specifica: spec(bikeCity,       'M'), location: locFirenze, assicurazione: assBase,  accessoriIds: [accBorsa.id] },
    { dataRitiro: new Date('2026-05-29'), oraRitiro: '11:00', dataConsegna: new Date('2026-05-30'), oraConsegna: '11:00', stato: 'RETURNED', totale: 61.0, utenteIdx: 2,  specifica: spec(bikeGiantE,     'M'), location: locMilano,  assicurazione: assKasko, accessoriIds: [accCasco.id, accSeggiolino.id] },
    { dataRitiro: new Date('2026-05-30'), oraRitiro: '09:00', dataConsegna: new Date('2026-05-30'), oraConsegna: '13:00', stato: 'RETURNED', totale: 20.0, utenteIdx: 3,  specifica: spec(bikeScott,      'M'), location: locRoma,    assicurazione: assBase,  accessoriIds: [] },
    { dataRitiro: new Date('2026-05-31'), oraRitiro: '10:00', dataConsegna: new Date('2026-05-31'), oraConsegna: '18:00', stato: 'RETURNED', totale: 53.0, utenteIdx: 4,  specifica: spec(bikeCity,       'L'), location: locMilano,  assicurazione: assMedio, accessoriIds: [accCasco.id], note: 'Foratura e sellino rotto durante caduta.' },

    // ── GIUGNO 2026 ──────────────────────────────────────────────────────────
    { dataRitiro: new Date('2026-06-01'), oraRitiro: '09:00', dataConsegna: new Date('2026-06-01'), oraConsegna: '13:00', stato: 'RETURNED',  totale: 23.0, utenteIdx: 5,  specifica: spec(bikeBianchi,    'S'), location: locTorino,  assicurazione: assBase,  accessoriIds: [accCasco.id] },
    { dataRitiro: new Date('2026-06-01'), oraRitiro: '10:00', dataConsegna: new Date('2026-06-02'), oraConsegna: '10:00', stato: 'RETURNED',  totale: 59.0, utenteIdx: 6,  specifica: spec(bikeTrekE,      'M'), location: locRoma,    assicurazione: assKasko, accessoriIds: [accCasco.id, accBorsa.id] },
    { dataRitiro: new Date('2026-06-02'), oraRitiro: '09:00', dataConsegna: new Date('2026-06-02'), oraConsegna: '13:00', stato: 'RETURNED',  totale: 16.0, utenteIdx: 7,  specifica: spec(bikeCity,       'S'), location: locFirenze, assicurazione: assBase,  accessoriIds: [] },
    { dataRitiro: new Date('2026-06-02'), oraRitiro: '11:00', dataConsegna: new Date('2026-06-03'), oraConsegna: '11:00', stato: 'RETURNED',  totale: 47.0, utenteIdx: 8,  specifica: spec(bikeSpecialized,'M'), location: locMilano,  assicurazione: assMedio, accessoriIds: [accLucchetto.id, accPompa.id] },
    { dataRitiro: new Date('2026-06-03'), oraRitiro: '09:00', dataConsegna: new Date('2026-06-03'), oraConsegna: '13:00', stato: 'RETURNED',  totale: 28.0, utenteIdx: 9,  specifica: spec(bikeScott,      'S'), location: locTorino,  assicurazione: assBase,  accessoriIds: [accCasco.id] },
    { dataRitiro: new Date('2026-06-03'), oraRitiro: '10:00', dataConsegna: new Date('2026-06-05'), oraConsegna: '10:00', stato: 'PICKED_UP', totale: 75.0, utenteIdx: 10, specifica: spec(bikeCity,       'M'), location: locRoma,    assicurazione: assKasko, accessoriIds: [accCasco.id, accBorsa.id, accSeggiolino.id] },
    { dataRitiro: new Date('2026-06-03'), oraRitiro: '11:00', dataConsegna: new Date('2026-06-04'), oraConsegna: '11:00', stato: 'PICKED_UP', totale: 40.0, utenteIdx: 11, specifica: spec(bikeGiantE,     'M'), location: locFirenze, assicurazione: assMedio, accessoriIds: [accCasco.id] },
    { dataRitiro: new Date('2026-06-04'), oraRitiro: '09:00', dataConsegna: new Date('2026-06-04'), oraConsegna: '13:00', stato: 'PENDING',   totale: 33.0, utenteIdx: 12, specifica: spec(bikeTrekE,      'S'), location: locMilano,  assicurazione: assBase,  accessoriIds: [accCasco.id, accLucchetto.id] },
    { dataRitiro: new Date('2026-06-04'), oraRitiro: '09:00', dataConsegna: new Date('2026-06-04'), oraConsegna: '13:00', stato: 'PENDING',   totale: 17.0, utenteIdx: 13, specifica: spec(bikeCity,       'S'), location: locTorino,  assicurazione: assBase,  accessoriIds: [] },
    { dataRitiro: new Date('2026-06-04'), oraRitiro: '10:00', dataConsegna: new Date('2026-06-04'), oraConsegna: '18:00', stato: 'PENDING',   totale: 50.0, utenteIdx: 14, specifica: spec(bikeSpecialized,'L'), location: locRoma,    assicurazione: assKasko, accessoriIds: [accCasco.id, accBorsa.id] },
    { dataRitiro: new Date('2026-06-04'), oraRitiro: '10:00', dataConsegna: new Date('2026-06-05'), oraConsegna: '10:00', stato: 'PENDING',   totale: 42.0, utenteIdx: 15, specifica: spec(bikeScott,      'M'), location: locFirenze, assicurazione: assMedio, accessoriIds: [accPompa.id] },
    { dataRitiro: new Date('2026-06-04'), oraRitiro: '11:00', dataConsegna: new Date('2026-06-04'), oraConsegna: '15:00', stato: 'PICKED_UP', totale: 25.0, utenteIdx: 16, specifica: spec(bikeBianchi,    'M'), location: locMilano,  assicurazione: assBase,  accessoriIds: [accCasco.id] },
    { dataRitiro: new Date('2026-06-05'), oraRitiro: '09:00', dataConsegna: new Date('2026-06-05'), oraConsegna: '13:00', stato: 'PENDING',   totale: 21.0, utenteIdx: 17, specifica: spec(bikeCity,       'M'), location: locMilano,  assicurazione: assBase,  accessoriIds: [] },
    { dataRitiro: new Date('2026-06-05'), oraRitiro: '10:00', dataConsegna: new Date('2026-06-06'), oraConsegna: '10:00', stato: 'PENDING',   totale: 66.0, utenteIdx: 18, specifica: spec(bikeTrekE,      'L'), location: locRoma,    assicurazione: assKasko, accessoriIds: [accCasco.id, accBorsa.id, accLucchetto.id] },
    { dataRitiro: new Date('2026-06-06'), oraRitiro: '09:00', dataConsegna: new Date('2026-06-06'), oraConsegna: '13:00', stato: 'PENDING',   totale: 19.0, utenteIdx: 19, specifica: spec(bikeGiantE,     'L'), location: locTorino,  assicurazione: assBase,  accessoriIds: [] },
  ]

  for (const p of prenotazioni) {
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
        locationId:   p.location.id,
        coperturaId:  p.assicurazione.id,
      },
    })

    // Accessori via tabella esplicita AccessorioPrenotazione
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
  console.log('   Clienti → vedi seed, password: changeme123')
}

main()
  .catch(e => { console.error('❌ Errore seed:', e); process.exit(1) })
  .finally(() => prisma.$disconnect())