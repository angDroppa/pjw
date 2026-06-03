import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'
import 'dotenv/config'
import { PrismaClient } from '@/app/generated/prisma/client'
import bcrypt from 'bcryptjs'

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
})

const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

async function main() {
  console.log('🌱 Avvio Seeder...')

  const password = await bcrypt.hash('password123', 10)

  // ---------------------------
  // PULIZIA DATABASE
  // ---------------------------

  await prisma.prenotazione.deleteMany()
  await prisma.dimensione.deleteMany()
  await prisma.notifica.deleteMany()
  await prisma.refreshToken.deleteMany()

  await prisma.bicicletta.deleteMany()

  await prisma.location.deleteMany()
  await prisma.assicurazione.deleteMany()
  await prisma.accessorio.deleteMany()

  await prisma.modello.deleteMany()
  await prisma.tipologia.deleteMany()

  await prisma.user.deleteMany()
  await prisma.role.deleteMany()

  console.log('🧹 Database pulito')

  // ---------------------------
  // RUOLI
  // ---------------------------

  await prisma.role.create({
    data: { role: 'ADMIN' },
  })

  await prisma.role.create({
    data: { role: 'USER' },
  })

  // ---------------------------
  // UTENTI
  // ---------------------------

  const utente1 = await prisma.user.create({
    data: {
      firstName: 'Mario',
      lastName: 'Rossi',
      email: 'mario.rossi@example.com',
      password,
      roleName: 'USER',
    },
  })

  const utente2 = await prisma.user.create({
    data: {
      firstName: 'Giulia',
      lastName: 'Bianchi',
      email: 'giulia.bianchi@example.com',
      password,
      roleName: 'USER',
    },
  })

  await prisma.user.create({
    data: {
      firstName: 'Alessandro',
      lastName: 'Staff',
      email: 'admin@bici-noleggio.it',
      password,
      roleName: 'ADMIN',
    },
  })

  // ---------------------------
  // TIPOLOGIE
  // ---------------------------

  const tipoMuscolare = await prisma.tipologia.create({
    data: {
      nome: 'Muscolare',
    },
  })

  const tipoElettrica = await prisma.tipologia.create({
    data: {
      nome: 'Elettrica',
    },
  })

  // ---------------------------
  // MODELLI
  // ---------------------------

  const modRockrider = await prisma.modello.create({
    data: { nome: 'Rockrider ST 540 (Mountain)' },
  })

  const modTriban = await prisma.modello.create({
    data: { nome: 'Triban RC 120 (Gravel/Corsa)' },
  })

  const modElops = await prisma.modello.create({
    data: { nome: 'Elops 520 (City Bike)' },
  })

  const modEST = await prisma.modello.create({
    data: { nome: 'E-ST 900 (E-MTB Professionale)' },
  })

  const modELight = await prisma.modello.create({
    data: { nome: 'E-Light Ultra (City E-Bike)' },
  })

  const modGraziella = await prisma.modello.create({
    data: { nome: 'Graziella Oro Vintage' },
  })

  // ---------------------------
  // ACCESSORI
  // ---------------------------

  const casco = await prisma.accessorio.create({
    data: { nome: 'Casco di Sicurezza Premium' },
  })

  const lucchetto = await prisma.accessorio.create({
    data: { nome: 'Lucchetto a Catena Rinforzata' },
  })

  const seggiolino = await prisma.accessorio.create({
    data: { nome: 'Seggiolino Posteriore Bimbo' },
  })

  const borracce = await prisma.accessorio.create({
    data: { nome: 'Kit Borraccia Termica e Supporto' },
  })

  const borse = await prisma.accessorio.create({
    data: { nome: 'Borse Laterali Impermeabili' },
  })

  const luci = await prisma.accessorio.create({
    data: { nome: 'Set Luci LED Notturne Extra' },
  })

  // ---------------------------
  // ASSICURAZIONI
  // ---------------------------

  const assBase = await prisma.assicurazione.create({
    data: {
      tipo: 'Protezione Base',
      dettagli:
        'Inclusa nel prezzo. Copre solo i danni strutturali spontanei del telaio.',
    },
  })

  const assSilver = await prisma.assicurazione.create({
    data: {
      tipo: 'Assicurazione Silver',
      dettagli:
        "Copre l'80% dei costi di riparazione in caso di cadute o danni accidentali.",
    },
  })

  const assKasko = await prisma.assicurazione.create({
    data: {
      tipo: 'Kasko Totale Gold',
      dettagli:
        'Copertura al 100% contro qualsiasi danno, atti vandalici e furto con scasso.',
    },
  })

  // ---------------------------
  // LOCATION
  // ---------------------------

  const locCentro = await prisma.location.create({
    data: {
      nome: 'Sede Centrale - Piazza Duomo',
      indirizzo: 'Piazza del Duomo 12, Milano',
    },
  })

  const locStazione = await prisma.location.create({
    data: {
      nome: 'Hub Stazione Centrale',
      indirizzo: 'Via Vittorio Pisani 22, Milano',
    },
  })

  const locParco = await prisma.location.create({
    data: {
      nome: 'Chiosco Parco Sempione',
      indirizzo: 'Viale Camoens, Milano',
    },
  })

  // ---------------------------
  // BICICLETTE
  // ---------------------------

  const biciRockrider = await prisma.bicicletta.create({
    data: {
      modelloId: modRockrider.id,
      tipologiaId: tipoMuscolare.id,
      dimensione: {
        create: [
          { taglia: 'S', numeroBiciclette: 2 },
          { taglia: 'M', numeroBiciclette: 3 },
          { taglia: 'L', numeroBiciclette: 2 },
        ],
      },
    },
  })

  const biciTriban = await prisma.bicicletta.create({
    data: {
      modelloId: modTriban.id,
      tipologiaId: tipoMuscolare.id,
      dimensione: {
        create: [
          { taglia: 'M', numeroBiciclette: 2 },
          { taglia: 'L', numeroBiciclette: 2 },
          { taglia: 'XL', numeroBiciclette: 1 },
        ],
      },
    },
  })

  const biciElops = await prisma.bicicletta.create({
    data: {
      modelloId: modElops.id,
      tipologiaId: tipoMuscolare.id,
      dimensione: {
        create: [
          { taglia: 'S', numeroBiciclette: 2 },
          { taglia: 'M', numeroBiciclette: 3 },
        ],
      },
    },
  })

  const biciGraziella = await prisma.bicicletta.create({
    data: {
      modelloId: modGraziella.id,
      tipologiaId: tipoMuscolare.id,
      dimensione: {
        create: [{ taglia: 'Unica', numeroBiciclette: 2 }],
      },
    },
  })

  const biciEST = await prisma.bicicletta.create({
    data: {
      modelloId: modEST.id,
      tipologiaId: tipoElettrica.id,
      dimensione: {
        create: [
          { taglia: 'M', numeroBiciclette: 2 },
          { taglia: 'L', numeroBiciclette: 2 },
          { taglia: 'XL', numeroBiciclette: 1 },
        ],
      },
    },
  })

  const biciELight = await prisma.bicicletta.create({
    data: {
      modelloId: modELight.id,
      tipologiaId: tipoElettrica.id,
      dimensione: {
        create: [
          { taglia: 'S', numeroBiciclette: 2 },
          { taglia: 'M', numeroBiciclette: 2 },
          { taglia: 'L', numeroBiciclette: 2 },
        ],
      },
    },
  })

  // ---------------------------
  // PRENOTAZIONI
  // ---------------------------

  await prisma.prenotazione.create({
    data: {
      dataRitiro: new Date('2026-06-10T09:00:00Z'),
      dataOreConsegna: new Date('2026-06-12T18:00:00Z'),
      dataPickUp: new Date('2026-06-10T09:15:00Z'),

      utenteId: utente1.id,
      biciclettaId: biciEST.id,
      locationId: locCentro.id,
      coperturaId: assKasko.id,

      accessori: {
        connect: [
          { id: casco.id },
          { id: lucchetto.id },
        ],
      },
    },
  })

  await prisma.prenotazione.create({
    data: {
      dataRitiro: new Date('2026-06-15T10:00:00Z'),
      dataOreConsegna: new Date('2026-06-15T20:00:00Z'),
      dataPickUp: new Date('2026-06-15T10:05:00Z'),

      utenteId: utente2.id,
      biciclettaId: biciElops.id,
      locationId: locParco.id,
      coperturaId: assSilver.id,

      accessori: {
        connect: [
          { id: seggiolino.id },
          { id: borse.id },
        ],
      },
    },
  })

  console.log('✅ Seed completato')
}

main()
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
    await pool.end()
  })