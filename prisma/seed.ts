import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'
import 'dotenv/config'
import { PrismaClient } from '@/app/generated/prisma/client'
import bcrypt from 'bcryptjs'

const pool = new Pool({ connectionString: process.env.DATABASE_URL })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

async function main() {
  console.log('🌱 Avvio del Seeder...')

  const password = await bcrypt.hash('password123', 10)

  // 1. RUOLI
  await prisma.role.upsert({ where: { role: 'ADMIN' }, update: {}, create: { role: 'ADMIN' } })
  await prisma.role.upsert({ where: { role: 'USER' },  update: {}, create: { role: 'USER' } })

  // 2. UTENTI
  const utente1 = await prisma.user.upsert({
    where: { email: 'mario.rossi@example.com' },
    update: { password },
    create: { firstName: 'Mario', lastName: 'Rossi', email: 'mario.rossi@example.com', password, roleName: 'USER' },
  })
  const utente2 = await prisma.user.upsert({
    where: { email: 'giulia.bianchi@example.com' },
    update: { password },
    create: { firstName: 'Giulia', lastName: 'Bianchi', email: 'giulia.bianchi@example.com', password, roleName: 'USER' },
  })
  await prisma.user.upsert({
    where: { email: 'admin@bici-noleggio.it' },
    update: { password },
    create: { firstName: 'Alessandro', lastName: 'Staff', email: 'admin@bici-noleggio.it', password, roleName: 'ADMIN' },
  })

  // 3. TIPOLOGIE
  const tipoMuscolare = await prisma.tipologia.upsert({ where: { id: 1 }, update: {}, create: { nome: 'Muscolare' } })
  const tipoElettrica = await prisma.tipologia.upsert({ where: { id: 2 }, update: {}, create: { nome: 'Elettrica' } })

  // 4. MODELLI
  const modRockrider = await prisma.modello.upsert({ where: { id: 1 }, update: {}, create: { nome: 'Rockrider ST 540 (Mountain)' } })
  const modTriban    = await prisma.modello.upsert({ where: { id: 2 }, update: {}, create: { nome: 'Triban RC 120 (Gravel/Corsa)' } })
  const modElops     = await prisma.modello.upsert({ where: { id: 3 }, update: {}, create: { nome: 'Elops 520 (City Bike)' } })
  const modE_ST      = await prisma.modello.upsert({ where: { id: 4 }, update: {}, create: { nome: 'E-ST 900 (E-MTB Professionale)' } })
  const modE_Lght    = await prisma.modello.upsert({ where: { id: 5 }, update: {}, create: { nome: 'E-Light Ultra (City E-Bike)' } })
  const modGraziella = await prisma.modello.upsert({ where: { id: 6 }, update: {}, create: { nome: 'Graziella Oro Vintage' } })

  // 5. ACCESSORI
  const casco      = await prisma.accessorio.upsert({ where: { id: 1 }, update: {}, create: { nome: 'Casco di Sicurezza Premium' } })
  const lucchetto  = await prisma.accessorio.upsert({ where: { id: 2 }, update: {}, create: { nome: 'Lucchetto a Catena Rinforzata' } })
  const seggiolino = await prisma.accessorio.upsert({ where: { id: 3 }, update: {}, create: { nome: 'Seggiolino Posteriore Bimbo' } })
  const borracce   = await prisma.accessorio.upsert({ where: { id: 4 }, update: {}, create: { nome: 'Kit Borraccia Termica e Supporto' } })
  const borse      = await prisma.accessorio.upsert({ where: { id: 5 }, update: {}, create: { nome: 'Borse Laterali Impermeabili' } })
  const luci       = await prisma.accessorio.upsert({ where: { id: 6 }, update: {}, create: { nome: 'Set Luci LED Notturne Extra' } })

  // 6. ASSICURAZIONI
  const assBase   = await prisma.assicurazione.upsert({ where: { id: 1 }, update: {}, create: { tipo: 'Protezione Base',     dettagli: 'Inclusa nel prezzo. Copre solo i danni strutturali spontanei del telaio.' } })
  const assSilver = await prisma.assicurazione.upsert({ where: { id: 2 }, update: {}, create: { tipo: 'Assicurazione Silver', dettagli: "Copre l'80% dei costi di riparazione in caso di cadute o danni accidentali." } })
  const assKasko  = await prisma.assicurazione.upsert({ where: { id: 3 }, update: {}, create: { tipo: 'Kasko Totale Gold',    dettagli: 'Copertura al 100% contro qualsiasi danno, atti vandalici e furto con scasso.' } })

  // 7. LOCATION
  const locCentro   = await prisma.location.upsert({ where: { id: 1 }, update: {}, create: { nome: 'Sede Centrale - Piazza Duomo', indirizzo: 'Piazza del Duomo 12, Milano' } })
  const locStazione = await prisma.location.upsert({ where: { id: 2 }, update: {}, create: { nome: 'Hub Stazione Centrale',        indirizzo: 'Via Vittorio Pisani 22, Milano' } })
  const locParco    = await prisma.location.upsert({ where: { id: 3 }, update: {}, create: { nome: 'Chiosco Parco Sempione',        indirizzo: 'Viale Camoens, Milano' } })

  // 8. BICICLETTE + DIMENSIONI
  // Ogni bicicletta è un "modello fisico" con le sue taglie disponibili e quantità
  console.log('🚲 Generazione parco biciclette con dimensioni...')

  const biciRockrider = await prisma.bicicletta.create({
    data: {
      modelloId: modRockrider.id,
      tipologiaId: tipoMuscolare.id,
      dimesione: {
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
      dimesione: {
        create: [
          { taglia: 'M',  numeroBiciclette: 2 },
          { taglia: 'L',  numeroBiciclette: 2 },
          { taglia: 'XL', numeroBiciclette: 1 },
        ],
      },
    },
  })

  const biciElops = await prisma.bicicletta.create({
    data: {
      modelloId: modElops.id,
      tipologiaId: tipoMuscolare.id,
      dimesione: {
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
      dimesione: {
        create: [
          { taglia: 'Unica', numeroBiciclette: 2 },
        ],
      },
    },
  })

  const biciE_ST = await prisma.bicicletta.create({
    data: {
      modelloId: modE_ST.id,
      tipologiaId: tipoElettrica.id,
      dimesione: {
        create: [
          { taglia: 'M',  numeroBiciclette: 2 },
          { taglia: 'L',  numeroBiciclette: 2 },
          { taglia: 'XL', numeroBiciclette: 1 },
        ],
      },
    },
  })

  const biciE_Lght = await prisma.bicicletta.create({
    data: {
      modelloId: modE_Lght.id,
      tipologiaId: tipoElettrica.id,
      dimesione: {
        create: [
          { taglia: 'S', numeroBiciclette: 2 },
          { taglia: 'M', numeroBiciclette: 2 },
          { taglia: 'L', numeroBiciclette: 2 },
        ],
      },
    },
  })

  // 9. PRENOTAZIONI
  console.log('📅 Generazione prenotazioni dimostrative...')

  await prisma.prenotazione.create({
    data: {
      dataRitiro:      new Date('2026-06-10T09:00:00Z'),
      dataOreConsegna: new Date('2026-06-12T18:00:00Z'),
      dataPickUp:      new Date('2026-06-10T09:15:00Z'),
      utenteId:     utente1.id,
      biciclettaId: biciE_ST.id,
      locationId:   locCentro.id,
      coperturaId:  assKasko.id,
      accessori: { connect: [{ id: casco.id }, { id: lucchetto.id }] },
    },
  })

  await prisma.prenotazione.create({
    data: {
      dataRitiro:      new Date('2026-06-15T10:00:00Z'),
      dataOreConsegna: new Date('2026-06-15T20:00:00Z'),
      dataPickUp:      new Date('2026-06-15T10:05:00Z'),
      utenteId:     utente2.id,
      biciclettaId: biciElops.id,
      locationId:   locParco.id,
      coperturaId:  assSilver.id,
      accessori: { connect: [{ id: seggiolino.id }, { id: borse.id }] },
    },
  })

  console.log('✅ Database popolato con successo!')
  console.log('📊 Riepilogo: 3 Utenti, 2 Tipologie, 6 Modelli, 6 Accessori, 3 Coperture, 3 Location, 6 Biciclette, 17 Dimensioni, 2 Prenotazioni.')
}

main()
  .catch((e) => {
    console.error('❌ Errore durante il seeding:', e)
    process.exit(1)
  })
  .finally(async () => {
    await pool.end()
  })