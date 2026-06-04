import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'
import 'dotenv/config'
import { PrismaClient } from '@/app/generated/prisma/client'
import bcrypt from 'bcryptjs'

const pool = new Pool({ connectionString: process.env.DATABASE_URL })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

function randomBetween(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function addDays(date: Date, days: number) {
  const d = new Date(date)
  d.setDate(d.getDate() + days)
  return d
}

function addHours(date: Date, hours: number) {
  return new Date(date.getTime() + hours * 60 * 60 * 1000)
}

async function main() {
  console.log('🌱 Seed ricco in avvio...')

  // ==========================================
  // 1. RUOLI
  // ==========================================
  await prisma.role.upsert({ where: { role: 'ADMIN' }, update: {}, create: { role: 'ADMIN' } })
  await prisma.role.upsert({ where: { role: 'STAFF' }, update: {}, create: { role: 'STAFF' } })
  await prisma.role.upsert({ where: { role: 'CUSTOMER' }, update: {}, create: { role: 'CUSTOMER' } })
  console.log('✅ Ruoli creati')

  // ==========================================
  // 2. STAFF
  // ==========================================
  const pwdStaff = await bcrypt.hash('admin1234', 12)

  await prisma.user.upsert({
    where: { email: 'admin@bikerent.com' },
    update: {},
    create: { firstName: 'Luca', lastName: 'Ferretti', email: 'admin@bikerent.com', password: pwdStaff, roleName: 'ADMIN' }
  })
  await prisma.user.upsert({
    where: { email: 'staff.milano@bikerent.com' },
    update: {},
    create: { firstName: 'Chiara', lastName: 'Mantovani', email: 'staff.milano@bikerent.com', password: pwdStaff, roleName: 'STAFF' }
  })
  await prisma.user.upsert({
    where: { email: 'staff.roma@bikerent.com' },
    update: {},
    create: { firstName: 'Davide', lastName: 'Esposito', email: 'staff.roma@bikerent.com', password: pwdStaff, roleName: 'STAFF' }
  })
  await prisma.user.upsert({
    where: { email: 'staff.torino@bikerent.com' },
    update: {},
    create: { firstName: 'Sara', lastName: 'Ricci', email: 'staff.torino@bikerent.com', password: pwdStaff, roleName: 'STAFF' }
  })
  console.log('✅ Staff creato')

  // ==========================================
  // 3. CLIENTI (20 utenti)
  // ==========================================
  const pwdCustomer = await bcrypt.hash('changeme123', 10)

  const clientiData = [
    { firstName: 'Mario',      lastName: 'Rossi',       email: 'mario.rossi@gmail.com' },
    { firstName: 'Giulia',     lastName: 'Bianchi',     email: 'giulia.bianchi@yahoo.it' },
    { firstName: 'Alessandro', lastName: 'Verdi',       email: 'ale.verdi@outlook.com' },
    { firstName: 'Francesca',  lastName: 'Colombo',     email: 'fra.colombo@gmail.com' },
    { firstName: 'Lorenzo',    lastName: 'Mancini',     email: 'lore.mancini@libero.it' },
    { firstName: 'Valentina',  lastName: 'Galli',       email: 'vale.galli@gmail.com' },
    { firstName: 'Matteo',     lastName: 'Conti',       email: 'matteo.conti@hotmail.it' },
    { firstName: 'Elena',      lastName: 'Ricci',       email: 'elena.ricci@gmail.com' },
    { firstName: 'Simone',     lastName: 'Bruno',       email: 'simone.bruno@outlook.com' },
    { firstName: 'Marta',      lastName: 'De Luca',     email: 'marta.deluca@gmail.com' },
    { firstName: 'Andrea',     lastName: 'Fontana',     email: 'andrea.fontana@yahoo.com' },
    { firstName: 'Sofia',      lastName: 'Moretti',     email: 'sofia.moretti@gmail.com' },
    { firstName: 'Riccardo',   lastName: 'Ferrari',     email: 'ric.ferrari@libero.it' },
    { firstName: 'Beatrice',   lastName: 'Leone',       email: 'bea.leone@gmail.com' },
    { firstName: 'Filippo',    lastName: 'Marini',      email: 'fil.marini@outlook.com' },
    { firstName: 'Giorgia',    lastName: 'Costa',       email: 'gio.costa@gmail.com' },
    { firstName: 'Marco',      lastName: 'Martinelli',  email: 'marco.martinelli@yahoo.it' },
    { firstName: 'Alessia',    lastName: 'Greco',       email: 'alessia.greco@gmail.com' },
    { firstName: 'Nicola',     lastName: 'Barbieri',    email: 'nicola.barbieri@libero.it' },
    { firstName: 'Camilla',    lastName: 'Palumbo',     email: 'camilla.palumbo@gmail.com' },
  ]

  const clienti = await Promise.all(
    clientiData.map(c =>
      prisma.user.upsert({
        where: { email: c.email },
        update: {},
        create: { ...c, password: pwdCustomer, roleName: 'CUSTOMER' }
      })
    )
  )
  console.log(`✅ ${clienti.length} clienti creati`)

  // ==========================================
  // 4. LOCATION (4 punti vendita)
  // ==========================================
  const locMilano = await prisma.location.create({
    data: { nome: 'Sede Centrale Milano', indirizzo: 'Via Dante 14, Milano', prezzoMezzaGiornata: 16.0 }
  })
  const locRoma = await prisma.location.create({
    data: { nome: 'Roma Termini', indirizzo: 'Piazza dei Cinquecento 1, Roma', prezzoMezzaGiornata: 18.0 }
  })
  const locTorino = await prisma.location.create({
    data: { nome: 'Torino Centro', indirizzo: 'Piazza Castello 9, Torino', prezzoMezzaGiornata: 14.0 }
  })
  const locFirenze = await prisma.location.create({
    data: { nome: 'Firenze Santa Maria Novella', indirizzo: 'Piazza della Stazione 4, Firenze', prezzoMezzaGiornata: 17.0 }
  })
  const negozi = [locMilano, locRoma, locTorino, locFirenze]
  console.log('✅ 4 location create')

  // ==========================================
  // 5. TIPOLOGIE (solo Elettrica e Muscolare)
  // ==========================================
  const tipoElettrica  = await prisma.tipologia.create({ data: { nome: 'Elettrica' } })
  const tipoMuscolare  = await prisma.tipologia.create({ data: { nome: 'Muscolare' } })

  // ==========================================
  // 6. ACCESSORI
  // ==========================================
  const accCasco       = await prisma.accessorio.create({ data: { nome: 'Casco di Protezione',         prezzo: 5.0  } })
  const accBorsa       = await prisma.accessorio.create({ data: { nome: 'Borsa Laterale Impermeabile', prezzo: 7.0  } })
  const accSeggiolino  = await prisma.accessorio.create({ data: { nome: 'Seggiolino Bimbo',             prezzo: 10.0 } })
  const accLucchetto   = await prisma.accessorio.create({ data: { nome: 'Lucchetto Antifurto',          prezzo: 3.0  } })
  const accPompa       = await prisma.accessorio.create({ data: { nome: 'Kit Riparazione Pneumatici',   prezzo: 4.0  } })
  const accessoriTutti = [accCasco, accBorsa, accSeggiolino, accLucchetto, accPompa]

  // ==========================================
  // 7. ASSICURAZIONI
  // ==========================================
  const assBase  = await prisma.assicurazione.create({ data: { tipo: 'Base',          dettagli: 'Copertura responsabilità civile verso terzi',    prezzo: 0.0  } })
  const assMedio = await prisma.assicurazione.create({ data: { tipo: 'Standard',      dettagli: 'Copertura danni accidentali con franchigia 50€', prezzo: 6.0  } })
  const assKasko = await prisma.assicurazione.create({ data: { tipo: 'Kasko Totale',  dettagli: 'Zero franchigia su furto e danni vandalici',      prezzo: 12.0 } })
  const assurazioni = [assBase, assMedio, assKasko]
  console.log('✅ Accessori e assicurazioni create')

  // ==========================================
  // 8. CATALOGO BICICLETTE (6 modelli)
  // ==========================================

  // Modelli elettrici
  const modTrekElettrica   = await prisma.modello.create({ data: { nome: 'Trek PowerFly E' } })
  const modSpecialized     = await prisma.modello.create({ data: { nome: 'Specialized Turbo Vado' } })
  const modGiantElettrica  = await prisma.modello.create({ data: { nome: 'Giant Explore E+' } })

  // Modelli muscolari
  const modCityClassic     = await prisma.modello.create({ data: { nome: 'City Bike Classic' } })
  const modScottGravel     = await prisma.modello.create({ data: { nome: 'Scott Speedster Gravel' } })
  const modBianchi         = await prisma.modello.create({ data: { nome: 'Bianchi C-Sport' } })

  // Biciclette fisiche
  const biciTrekE = await prisma.bicicletta.create({
    data: {
      modelloId: modTrekElettrica.id,
      tipologie: { connect: [{ id: tipoElettrica.id }] },
      dimensioni: { create: [
        { taglia: 'S', quantitaElettrico: 5,  quantitaMuscolare: 0 },
        { taglia: 'M', quantitaElettrico: 10, quantitaMuscolare: 0 },
        { taglia: 'L', quantitaElettrico: 8,  quantitaMuscolare: 0 },
        { taglia: 'XL',quantitaElettrico: 4,  quantitaMuscolare: 0 },
      ]}
    }
  })

  const biciSpecialized = await prisma.bicicletta.create({
    data: {
      modelloId: modSpecialized.id,
      tipologie: { connect: [{ id: tipoElettrica.id }] },
      dimensioni: { create: [
        { taglia: 'S', quantitaElettrico: 4, quantitaMuscolare: 0 },
        { taglia: 'M', quantitaElettrico: 7, quantitaMuscolare: 0 },
        { taglia: 'L', quantitaElettrico: 6, quantitaMuscolare: 0 },
      ]}
    }
  })

  const biciGiantE = await prisma.bicicletta.create({
    data: {
      modelloId: modGiantElettrica.id,
      tipologie: { connect: [{ id: tipoElettrica.id }] },
      dimensioni: { create: [
        { taglia: 'M', quantitaElettrico: 6, quantitaMuscolare: 0 },
        { taglia: 'L', quantitaElettrico: 5, quantitaMuscolare: 0 },
      ]}
    }
  })

  const biciCity = await prisma.bicicletta.create({
    data: {
      modelloId: modCityClassic.id,
      tipologie: { connect: [{ id: tipoMuscolare.id }] },
      dimensioni: { create: [
        { taglia: 'S',  quantitaElettrico: 0, quantitaMuscolare: 15 },
        { taglia: 'M',  quantitaElettrico: 0, quantitaMuscolare: 20 },
        { taglia: 'L',  quantitaElettrico: 0, quantitaMuscolare: 14 },
        { taglia: 'XL', quantitaElettrico: 0, quantitaMuscolare: 8  },
      ]}
    }
  })

  const biciScott = await prisma.bicicletta.create({
    data: {
      modelloId: modScottGravel.id,
      tipologie: { connect: [{ id: tipoMuscolare.id }] },
      dimensioni: { create: [
        { taglia: 'S', quantitaElettrico: 0, quantitaMuscolare: 8  },
        { taglia: 'M', quantitaElettrico: 0, quantitaMuscolare: 12 },
        { taglia: 'L', quantitaElettrico: 0, quantitaMuscolare: 10 },
      ]}
    }
  })

  const biciBianchi = await prisma.bicicletta.create({
    data: {
      modelloId: modBianchi.id,
      tipologie: { connect: [{ id: tipoMuscolare.id }] },
      dimensioni: { create: [
        { taglia: 'S', quantitaElettrico: 0, quantitaMuscolare: 6  },
        { taglia: 'M', quantitaElettrico: 0, quantitaMuscolare: 9  },
        { taglia: 'L', quantitaElettrico: 0, quantitaMuscolare: 7  },
      ]}
    }
  })

  const tutteLeBici = [biciTrekE, biciSpecialized, biciGiantE, biciCity, biciScott, biciBianchi]
  console.log('✅ 6 modelli biciclette creati')

  // ==========================================
  // 9. STOCK PER NEGOZIO
  // ==========================================

  // Milano — grande hub, tutto disponibile
  await prisma.stockBicicletta.createMany({ data: [
    { locationId: locMilano.id, biciclettaId: biciTrekE.id,       quantita: 18, inManutenzione: 2 },
    { locationId: locMilano.id, biciclettaId: biciSpecialized.id, quantita: 12, inManutenzione: 1 },
    { locationId: locMilano.id, biciclettaId: biciGiantE.id,      quantita: 8,  inManutenzione: 0 },
    { locationId: locMilano.id, biciclettaId: biciCity.id,        quantita: 35, inManutenzione: 3 },
    { locationId: locMilano.id, biciclettaId: biciScott.id,       quantita: 20, inManutenzione: 0 },
    { locationId: locMilano.id, biciclettaId: biciBianchi.id,     quantita: 14, inManutenzione: 1 },
  ]})

  // Roma — focus turisti, più elettriche
  await prisma.stockBicicletta.createMany({ data: [
    { locationId: locRoma.id, biciclettaId: biciTrekE.id,       quantita: 14, inManutenzione: 0 },
    { locationId: locRoma.id, biciclettaId: biciSpecialized.id, quantita: 10, inManutenzione: 2 },
    { locationId: locRoma.id, biciclettaId: biciGiantE.id,      quantita: 6,  inManutenzione: 1 },
    { locationId: locRoma.id, biciclettaId: biciCity.id,        quantita: 25, inManutenzione: 0 },
    { locationId: locRoma.id, biciclettaId: biciScott.id,       quantita: 8,  inManutenzione: 1 },
    { locationId: locRoma.id, biciclettaId: biciBianchi.id,     quantita: 10, inManutenzione: 0 },
  ]})

  // Torino — medio, più muscolari
  await prisma.stockBicicletta.createMany({ data: [
    { locationId: locTorino.id, biciclettaId: biciTrekE.id,       quantita: 6,  inManutenzione: 1 },
    { locationId: locTorino.id, biciclettaId: biciSpecialized.id, quantita: 4,  inManutenzione: 0 },
    { locationId: locTorino.id, biciclettaId: biciCity.id,        quantita: 20, inManutenzione: 2 },
    { locationId: locTorino.id, biciclettaId: biciScott.id,       quantita: 14, inManutenzione: 0 },
    { locationId: locTorino.id, biciclettaId: biciBianchi.id,     quantita: 8,  inManutenzione: 1 },
  ]})

  // Firenze — piccolo, solo i modelli più richiesti
  await prisma.stockBicicletta.createMany({ data: [
    { locationId: locFirenze.id, biciclettaId: biciTrekE.id,   quantita: 8,  inManutenzione: 0 },
    { locationId: locFirenze.id, biciclettaId: biciGiantE.id,  quantita: 4,  inManutenzione: 1 },
    { locationId: locFirenze.id, biciclettaId: biciCity.id,    quantita: 18, inManutenzione: 1 },
    { locationId: locFirenze.id, biciclettaId: biciBianchi.id, quantita: 6,  inManutenzione: 0 },
  ]})
  console.log('✅ Stock popolati per 4 negozi')

  // ==========================================
  // 10. PRENOTAZIONI STORICHE (40 prenotazioni)
  //     Mix realistico di stati, negozi, bici, utenti
  // ==========================================

  type StatoPren = 'PENDING' | 'PICKED_UP' | 'RETURNED' | 'LATE' | 'DAMAGED' | 'CANCELLED'

  interface PrenData {
    ritiro: Date
    consegna: Date
    pickUp: Date
    stato: StatoPren
    totale: number
    utenteIdx: number
    bici: typeof biciTrekE
    location: typeof locMilano
    assicurazione: typeof assBase
    accessoriIds: number[]
    note?: string
  }

  const prenotazioni: PrenData[] = [
    // --- MAGGIO 2026 (storico completato) ---
    { ritiro: new Date('2026-05-05T09:00Z'), consegna: new Date('2026-05-05T13:00Z'), pickUp: new Date('2026-05-05T09:00Z'), stato: 'RETURNED', totale: 21.0, utenteIdx: 0,  bici: biciCity,       location: locMilano,  assicurazione: assBase,  accessoriIds: [accCasco.id] },
    { ritiro: new Date('2026-05-06T10:00Z'), consegna: new Date('2026-05-06T18:00Z'), pickUp: new Date('2026-05-06T10:10Z'), stato: 'RETURNED', totale: 44.0, utenteIdx: 1,  bici: biciTrekE,      location: locRoma,    assicurazione: assKasko, accessoriIds: [accCasco.id, accBorsa.id] },
    { ritiro: new Date('2026-05-07T09:00Z'), consegna: new Date('2026-05-07T13:00Z'), pickUp: new Date('2026-05-07T09:05Z'), stato: 'RETURNED', totale: 18.0, utenteIdx: 2,  bici: biciScott,      location: locTorino,  assicurazione: assBase,  accessoriIds: [] },
    { ritiro: new Date('2026-05-08T11:00Z'), consegna: new Date('2026-05-08T19:00Z'), pickUp: new Date('2026-05-08T11:00Z'), stato: 'RETURNED', totale: 52.0, utenteIdx: 3,  bici: biciSpecialized,location: locMilano,  assicurazione: assMedio, accessoriIds: [accLucchetto.id] },
    { ritiro: new Date('2026-05-09T09:00Z'), consegna: new Date('2026-05-09T13:00Z'), pickUp: new Date('2026-05-09T09:00Z'), stato: 'RETURNED', totale: 29.0, utenteIdx: 4,  bici: biciBianchi,    location: locFirenze, assicurazione: assBase,  accessoriIds: [accCasco.id, accPompa.id] },
    { ritiro: new Date('2026-05-10T10:00Z'), consegna: new Date('2026-05-10T18:00Z'), pickUp: new Date('2026-05-10T10:15Z'), stato: 'RETURNED', totale: 38.0, utenteIdx: 5,  bici: biciCity,       location: locRoma,    assicurazione: assMedio, accessoriIds: [accBorsa.id] },
    { ritiro: new Date('2026-05-12T09:00Z'), consegna: new Date('2026-05-12T13:00Z'), pickUp: new Date('2026-05-12T09:00Z'), stato: 'RETURNED', totale: 16.0, utenteIdx: 6,  bici: biciCity,       location: locTorino,  assicurazione: assBase,  accessoriIds: [] },
    { ritiro: new Date('2026-05-13T09:00Z'), consegna: new Date('2026-05-14T13:00Z'), pickUp: new Date('2026-05-13T09:05Z'), stato: 'RETURNED', totale: 67.0, utenteIdx: 7,  bici: biciTrekE,      location: locMilano,  assicurazione: assKasko, accessoriIds: [accCasco.id, accBorsa.id, accLucchetto.id] },
    { ritiro: new Date('2026-05-14T10:00Z'), consegna: new Date('2026-05-14T18:00Z'), pickUp: new Date('2026-05-14T10:00Z'), stato: 'RETURNED', totale: 31.0, utenteIdx: 8,  bici: biciScott,      location: locFirenze, assicurazione: assBase,  accessoriIds: [accPompa.id] },
    { ritiro: new Date('2026-05-15T09:00Z'), consegna: new Date('2026-05-15T13:00Z'), pickUp: new Date('2026-05-15T09:10Z'), stato: 'RETURNED', totale: 24.0, utenteIdx: 9,  bici: biciBianchi,    location: locMilano,  assicurazione: assBase,  accessoriIds: [accCasco.id] },
    { ritiro: new Date('2026-05-16T11:00Z'), consegna: new Date('2026-05-17T11:00Z'), pickUp: new Date('2026-05-16T11:00Z'), stato: 'RETURNED', totale: 58.0, utenteIdx: 10, bici: biciGiantE,     location: locRoma,    assicurazione: assKasko, accessoriIds: [accCasco.id, accSeggiolino.id] },
    { ritiro: new Date('2026-05-17T09:00Z'), consegna: new Date('2026-05-17T13:00Z'), pickUp: new Date('2026-05-17T09:00Z'), stato: 'CANCELLED', totale: 0.0, utenteIdx: 11, bici: biciCity,       location: locTorino,  assicurazione: assBase,  accessoriIds: [] },
    { ritiro: new Date('2026-05-18T10:00Z'), consegna: new Date('2026-05-18T18:00Z'), pickUp: new Date('2026-05-18T10:00Z'), stato: 'RETURNED', totale: 45.0, utenteIdx: 12, bici: biciSpecialized,location: locFirenze, assicurazione: assMedio, accessoriIds: [accCasco.id, accBorsa.id] },
    { ritiro: new Date('2026-05-19T09:00Z'), consegna: new Date('2026-05-19T13:00Z'), pickUp: new Date('2026-05-19T09:05Z'), stato: 'RETURNED', totale: 19.0, utenteIdx: 13, bici: biciCity,       location: locMilano,  assicurazione: assBase,  accessoriIds: [] },
    { ritiro: new Date('2026-05-20T10:00Z'), consegna: new Date('2026-05-21T10:00Z'), pickUp: new Date('2026-05-20T10:10Z'), stato: 'DAMAGED',  totale: 54.0, utenteIdx: 14, bici: biciTrekE,      location: locRoma,    assicurazione: assMedio, accessoriIds: [accCasco.id], note: 'Graffi profondi sul telaio, rottura leva freno anteriore.' },
    { ritiro: new Date('2026-05-21T09:00Z'), consegna: new Date('2026-05-21T13:00Z'), pickUp: new Date('2026-05-21T09:00Z'), stato: 'RETURNED', totale: 22.0, utenteIdx: 15, bici: biciBianchi,    location: locTorino,  assicurazione: assBase,  accessoriIds: [accLucchetto.id] },
    { ritiro: new Date('2026-05-22T11:00Z'), consegna: new Date('2026-05-22T19:00Z'), pickUp: new Date('2026-05-22T11:10Z'), stato: 'RETURNED', totale: 36.0, utenteIdx: 16, bici: biciScott,      location: locMilano,  assicurazione: assBase,  accessoriIds: [accPompa.id] },
    { ritiro: new Date('2026-05-23T09:00Z'), consegna: new Date('2026-05-23T13:00Z'), pickUp: new Date('2026-05-23T09:00Z'), stato: 'CANCELLED', totale: 0.0, utenteIdx: 17, bici: biciGiantE,     location: locFirenze, assicurazione: assBase,  accessoriIds: [] },
    { ritiro: new Date('2026-05-25T10:00Z'), consegna: new Date('2026-05-25T18:00Z'), pickUp: new Date('2026-05-25T10:00Z'), stato: 'RETURNED', totale: 48.0, utenteIdx: 18, bici: biciTrekE,      location: locMilano,  assicurazione: assKasko, accessoriIds: [accCasco.id, accBorsa.id] },
    { ritiro: new Date('2026-05-26T09:00Z'), consegna: new Date('2026-05-26T13:00Z'), pickUp: new Date('2026-05-26T09:05Z'), stato: 'RETURNED', totale: 17.0, utenteIdx: 19, bici: biciCity,       location: locRoma,    assicurazione: assBase,  accessoriIds: [] },
    { ritiro: new Date('2026-05-27T09:00Z'), consegna: new Date('2026-05-28T09:00Z'), pickUp: new Date('2026-05-27T09:00Z'), stato: 'LATE',     totale: 72.0, utenteIdx: 0,  bici: biciSpecialized,location: locTorino,  assicurazione: assMedio, accessoriIds: [accCasco.id, accLucchetto.id], note: 'Cliente bloccato in autostrada, rientro previsto in serata.' },
    { ritiro: new Date('2026-05-28T10:00Z'), consegna: new Date('2026-05-28T14:00Z'), pickUp: new Date('2026-05-28T10:00Z'), stato: 'RETURNED', totale: 26.0, utenteIdx: 1,  bici: biciCity,       location: locFirenze, assicurazione: assBase,  accessoriIds: [accBorsa.id] },
    { ritiro: new Date('2026-05-29T11:00Z'), consegna: new Date('2026-05-30T11:00Z'), pickUp: new Date('2026-05-29T11:10Z'), stato: 'RETURNED', totale: 61.0, utenteIdx: 2,  bici: biciGiantE,     location: locMilano,  assicurazione: assKasko, accessoriIds: [accCasco.id, accSeggiolino.id] },
    { ritiro: new Date('2026-05-30T09:00Z'), consegna: new Date('2026-05-30T13:00Z'), pickUp: new Date('2026-05-30T09:00Z'), stato: 'RETURNED', totale: 20.0, utenteIdx: 3,  bici: biciScott,      location: locRoma,    assicurazione: assBase,  accessoriIds: [] },
    { ritiro: new Date('2026-05-31T10:00Z'), consegna: new Date('2026-05-31T18:00Z'), pickUp: new Date('2026-05-31T10:05Z'), stato: 'DAMAGED',  totale: 53.0, utenteIdx: 4,  bici: biciCity,       location: locMilano,  assicurazione: assMedio, accessoriIds: [accCasco.id], note: 'Foratura doppia e sellino rotto durante caduta.' },

    // --- GIUGNO 2026 (mix attivo) ---
    { ritiro: new Date('2026-06-01T09:00Z'), consegna: new Date('2026-06-01T13:00Z'), pickUp: new Date('2026-06-01T09:00Z'), stato: 'RETURNED', totale: 23.0, utenteIdx: 5,  bici: biciBianchi,    location: locTorino,  assicurazione: assBase,  accessoriIds: [accCasco.id] },
    { ritiro: new Date('2026-06-01T10:00Z'), consegna: new Date('2026-06-02T10:00Z'), pickUp: new Date('2026-06-01T10:10Z'), stato: 'RETURNED', totale: 59.0, utenteIdx: 6,  bici: biciTrekE,      location: locRoma,    assicurazione: assKasko, accessoriIds: [accCasco.id, accBorsa.id] },
    { ritiro: new Date('2026-06-02T09:00Z'), consegna: new Date('2026-06-02T13:00Z'), pickUp: new Date('2026-06-02T09:00Z'), stato: 'RETURNED', totale: 16.0, utenteIdx: 7,  bici: biciCity,       location: locFirenze, assicurazione: assBase,  accessoriIds: [] },
    { ritiro: new Date('2026-06-02T11:00Z'), consegna: new Date('2026-06-03T11:00Z'), pickUp: new Date('2026-06-02T11:05Z'), stato: 'RETURNED', totale: 47.0, utenteIdx: 8,  bici: biciSpecialized,location: locMilano,  assicurazione: assMedio, accessoriIds: [accLucchetto.id, accPompa.id] },
    { ritiro: new Date('2026-06-03T09:00Z'), consegna: new Date('2026-06-03T13:00Z'), pickUp: new Date('2026-06-03T09:00Z'), stato: 'RETURNED', totale: 28.0, utenteIdx: 9,  bici: biciScott,      location: locTorino,  assicurazione: assBase,  accessoriIds: [accCasco.id] },
    { ritiro: new Date('2026-06-03T10:00Z'), consegna: new Date('2026-06-05T10:00Z'), pickUp: new Date('2026-06-03T10:15Z'), stato: 'PICKED_UP',totale: 75.0, utenteIdx: 10, bici: biciCity,       location: locRoma,    assicurazione: assKasko, accessoriIds: [accCasco.id, accBorsa.id, accSeggiolino.id] },
    { ritiro: new Date('2026-06-03T11:00Z'), consegna: new Date('2026-06-04T11:00Z'), pickUp: new Date('2026-06-03T11:00Z'), stato: 'PICKED_UP',totale: 40.0, utenteIdx: 11, bici: biciGiantE,     location: locFirenze, assicurazione: assMedio, accessoriIds: [accCasco.id] },
    { ritiro: new Date('2026-06-04T09:00Z'), consegna: new Date('2026-06-04T13:00Z'), pickUp: new Date('2026-06-04T09:00Z'), stato: 'PENDING',  totale: 33.0, utenteIdx: 12, bici: biciTrekE,      location: locMilano,  assicurazione: assBase,  accessoriIds: [accCasco.id, accLucchetto.id] },
    { ritiro: new Date('2026-06-04T09:00Z'), consegna: new Date('2026-06-04T13:00Z'), pickUp: new Date('2026-06-04T09:00Z'), stato: 'PENDING',  totale: 17.0, utenteIdx: 13, bici: biciCity,       location: locTorino,  assicurazione: assBase,  accessoriIds: [] },
    { ritiro: new Date('2026-06-04T10:00Z'), consegna: new Date('2026-06-04T18:00Z'), pickUp: new Date('2026-06-04T10:00Z'), stato: 'PENDING',  totale: 50.0, utenteIdx: 14, bici: biciSpecialized,location: locRoma,    assicurazione: assKasko, accessoriIds: [accCasco.id, accBorsa.id] },
    { ritiro: new Date('2026-06-04T10:00Z'), consegna: new Date('2026-06-05T10:00Z'), pickUp: new Date('2026-06-04T10:05Z'), stato: 'PENDING',  totale: 42.0, utenteIdx: 15, bici: biciScott,      location: locFirenze, assicurazione: assMedio, accessoriIds: [accPompa.id] },
    { ritiro: new Date('2026-06-04T11:00Z'), consegna: new Date('2026-06-04T15:00Z'), pickUp: new Date('2026-06-04T11:00Z'), stato: 'PICKED_UP',totale: 25.0, utenteIdx: 16, bici: biciBianchi,    location: locMilano,  assicurazione: assBase,  accessoriIds: [accCasco.id] },
    { ritiro: new Date('2026-06-05T09:00Z'), consegna: new Date('2026-06-05T13:00Z'), pickUp: new Date('2026-06-05T09:00Z'), stato: 'PENDING',  totale: 21.0, utenteIdx: 17, bici: biciCity,       location: locMilano,  assicurazione: assBase,  accessoriIds: [] },
    { ritiro: new Date('2026-06-05T10:00Z'), consegna: new Date('2026-06-06T10:00Z'), pickUp: new Date('2026-06-05T10:00Z'), stato: 'PENDING',  totale: 66.0, utenteIdx: 18, bici: biciTrekE,      location: locRoma,    assicurazione: assKasko, accessoriIds: [accCasco.id, accBorsa.id, accLucchetto.id] },
    { ritiro: new Date('2026-06-06T09:00Z'), consegna: new Date('2026-06-06T13:00Z'), pickUp: new Date('2026-06-06T09:00Z'), stato: 'PENDING',  totale: 19.0, utenteIdx: 19, bici: biciGiantE,     location: locTorino,  assicurazione: assBase,  accessoriIds: [] },
  ]

  for (const p of prenotazioni) {
    await prisma.prenotazione.create({
      data: {
        dataRitiro:      p.ritiro,
        dataOreConsegna: p.consegna,
        dataPickUp:      p.pickUp,
        stato:           p.stato,
        totalePagato:    p.totale,
        noteProblemi:    p.note,
        utenteId:        clienti[p.utenteIdx].id,
        biciclettaId:    p.bici.id,
        locationId:      p.location.id,
        coperturaId:     p.assicurazione.id,
        accessori:       p.accessoriIds.length > 0 ? { connect: p.accessoriIds.map(id => ({ id })) } : undefined,
      }
    })
  }

  console.log(`✅ ${prenotazioni.length} prenotazioni create`)
  console.log('')
  console.log('🏁 Seed completato!')
  console.log('   Credenziali admin → admin@bikerent.com / admin1234')
  console.log('   Credenziali clienti → vedi seed, password: changeme123')
}

main()
  .catch(e => { console.error('❌ Errore seed:', e); process.exit(1) })
  .finally(() => prisma.$disconnect())