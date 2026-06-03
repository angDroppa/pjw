// prisma/seed.ts
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'
import 'dotenv/config'
import { PrismaClient } from '@/app/generated/prisma/client'

const pool = new Pool({ connectionString: process.env.DATABASE_URL })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

async function main() {
  console.log('🌱 Avvio del Super Seeder (Popolamento dati intensivo)...')

  // 1. CREAZIONE RUOLI
  const adminRole = await prisma.role.upsert({
    where: { role: 'ADMIN' },
    update: {},
    create: { role: 'ADMIN' },
  })
  const userRole = await prisma.role.upsert({
    where: { role: 'USER' },
    update: {},
    create: { role: 'USER' },
  })

  // 2. CREAZIONE UTENTI DI TEST (Clienti e Admin)
  const utente1 = await prisma.user.upsert({
    where: { email: 'mario.rossi@example.com' },
    update: {},
    create: {
      firstName: 'Mario',
      lastName: 'Rossi',
      email: 'mario.rossi@example.com',
      password: 'password_sicura_1',
      roleName: 'USER',
    },
  })

  const utente2 = await prisma.user.upsert({
    where: { email: 'giulia.bianchi@example.com' },
    update: {},
    create: {
      firstName: 'Giulia',
      lastName: 'Bianchi',
      email: 'giulia.bianchi@example.com',
      password: 'password_sicura_2',
      roleName: 'USER',
    },
  })

  const admin = await prisma.user.upsert({
    where: { email: 'admin@bici-noleggio.it' },
    update: {},
    create: {
      firstName: 'Alessandro',
      lastName: 'Staff',
      email: 'admin@bici-noleggio.it',
      password: 'super_admin_pass',
      roleName: 'ADMIN',
    },
  })

  // 3. LE DUE TIPOLOGIE RICHIESTE (Muscolare ed Elettrica)
  const tipoMuscolare = await prisma.tipologia.create({ data: { nome: 'Muscolare' } })
  const tipoElettrica = await prisma.tipologia.create({ data: { nome: 'Elettrica' } })

  // 4. CREAZIONE MODELLI (I brand e i nomi commerciali delle linee di bici)
  const modRockrider  = await prisma.modello.create({ data: { nome: 'Rockrider ST 540 (Mountain)' } })
  const modTriban     = await prisma.modello.create({ data: { nome: 'Triban RC 120 (Gravel/Corsa)' } })
  const modElops      = await prisma.modello.create({ data: { nome: 'Elops 520 (City Bike)' } })
  const modE_ST       = await prisma.modello.create({ data: { nome: 'E-ST 900 (E-MTB Professionale)' } })
  const modE_Lght     = await prisma.modello.create({ data: { nome: 'E-Light Ultra (City E-Bike)' } })
  const modGraziella  = await prisma.modello.create({ data: { nome: 'Graziella Oro Vintage' } })

  // 5. CREAZIONE ACCESSORI (Selezionabili nella Product Card in fase di prenotazione)
  const casco       = await prisma.accessorio.create({ data: { nome: 'Casco di Sicurezza Premium' } })
  const lucchetto   = await prisma.accessorio.create({ data: { nome: 'Lucchetto a Catena Rinforzata' } })
  const seggiolino  = await prisma.accessorio.create({ data: { nome: 'Seggiolino Posteriore Bimbo' } })
  const borracce    = await prisma.accessorio.create({ data: { nome: 'Kit Borraccia Termica e Supporto' } })
  const borse       = await prisma.accessorio.create({ data: { nome: 'Borse Laterali Impermeabili' } })
  const luci        = await prisma.accessorio.create({ data: { nome: 'Set Luci LED Notturne Extra' } })

  // 6. CREAZIONE ASSICURAZIONI / COPERTURE (Selezionabili nella Product Card)
  const assBase = await prisma.assicurazione.create({
    data: { tipo: 'Protezione Base', dettagli: 'Inclusa nel prezzo. Copre solo i danni strutturali spontanei del telaio.' },
  })
  const assSilver = await prisma.assicurazione.create({
    data: { tipo: 'Assicurazione Silver', dettagli: 'Copre l\'80% dei costi di riparazione in caso di cadute o danni accidentali.' },
  })
  const assKasko = await prisma.assicurazione.create({
    data: { tipo: 'Kasko Totale Gold', dettagli: 'Copertura al 100% contro qualsiasi danno, atti vandalici e furto con scasso.' },
  })

  // 7. CREAZIONE LOCATION DI RITIRO/CONSEGNA
  const locCentro = await prisma.location.create({
    data: { nome: 'Sede Centrale - Piazza Duomo', indirizzo: 'Piazza del Duomo 12, Milano' },
  })
  const locStazione = await prisma.location.create({
    data: { nome: 'Hub Stazione Centrale', indirizzo: 'Via Vittorio Pisani 22, Milano' },
  })
  const locParco = await prisma.location.create({
    data: { nome: 'Chiosco Parco Sempione', indirizzo: 'Viale Camoens, Milano' },
  })

  // 8. UN BEL CATALOGO LUNGO DI BICICLETTE "NUDE" (16 Bici Totali)
  console.log('🚲 Generazione del parco biciclette nel catalogo...')
  
  const parcoBiciDati = [
    // --- BICI MUSCOLARI ---
    { dimensione: 'S', modelloId: modRockrider.id, tipologiaId: tipoMuscolare.id },
    { dimensione: 'M', modelloId: modRockrider.id, tipologiaId: tipoMuscolare.id },
    { dimensione: 'M', modelloId: modRockrider.id, tipologiaId: tipoMuscolare.id },
    { dimensione: 'L', modelloId: modRockrider.id, tipologiaId: tipoMuscolare.id },
    
    { dimensione: 'M', modelloId: modTriban.id,    tipologiaId: tipoMuscolare.id },
    { dimensione: 'L', modelloId: modTriban.id,    tipologiaId: tipoMuscolare.id },
    { dimensione: 'XL', modelloId: modTriban.id,   tipologiaId: tipoMuscolare.id },

    { dimensione: 'S', modelloId: modElops.id,     tipologiaId: tipoMuscolare.id },
    { dimensione: 'M', modelloId: modElops.id,     tipologiaId: tipoMuscolare.id },
    
    { dimensione: 'Unica', modelloId: modGraziella.id, tipologiaId: tipoMuscolare.id },
    { dimensione: 'Unica', modelloId: modGraziella.id, tipologiaId: tipoMuscolare.id },

    // --- BICI ELETTRICHE ---
    { dimensione: 'M', modelloId: modE_ST.id,      tipologiaId: tipoElettrica.id },
    { dimensione: 'L', modelloId: modE_ST.id,      tipologiaId: tipoElettrica.id },
    { dimensione: 'XL', modelloId: modE_ST.id,     tipologiaId: tipoElettrica.id },

    { dimensione: 'S', modelloId: modE_Lght.id,    tipologiaId: tipoElettrica.id },
    { dimensione: 'M', modelloId: modE_Lght.id,    tipologiaId: tipoElettrica.id },
    { dimensione: 'L', modelloId: modE_Lght.id,    tipologiaId: tipoElettrica.id },
  ]

  // Salviamo le bici nel DB ciclando l'array
  const biciSalvate = []
  for (const datiBici of parcoBiciDati) {
    const bici = await prisma.bicicletta.create({ data: datiBici })
    biciSalvate.push(bici)
  }

  // 9. CREAZIONE DI QUALCHE PRENOTAZIONE DI STORICO (Giusto per popolare il DB)
  console.log('📅 Generazione di alcune prenotazioni dimostrative...')
  
  // Prenotazione 1: Mario Rossi prenota una e-bike (biciSalvate[12] -> E-ST M) con Kasko e Accessori
  await prisma.prenotazione.create({
    data: {
      dataRitiro: new Date('2026-06-10T09:00:00Z'),
      dataOreConsegna: new Date('2026-06-12T18:00:00Z'),
      dataPickUp: new Date('2026-06-10T09:15:00Z'),
      utenteId: utente1.id,
      biciclettaId: biciSalvate[12].id, 
      locationId: locCentro.id,
      coperturaId: assKasko.id,
      accessori: {
        connect: [{ id: casco.id }, { id: lucchetto.id }]
      }
    }
  })

  // Prenotazione 2: Giulia Bianchi prenota una City Bike Muscolare con seggiolino e borsa
  await prisma.prenotazione.create({
    data: {
      dataRitiro: new Date('2026-06-15T10:00:00Z'),
      dataOreConsegna: new Date('2026-06-15T20:00:00Z'),
      dataPickUp: new Date('2026-06-15T10:05:00Z'),
      utenteId: utente2.id,
      biciclettaId: biciSalvate[7].id, // Elops S
      locationId: locParco.id,
      coperturaId: assSilver.id,
      accessori: {
        connect: [{ id: seggiolino.id }, { id: borse.id }]
      }
    }
  })

  console.log(`✅ Database popolato con successo!`);
  console.log(`📊 Riepilogo: 3 Utenti, 2 Tipologie, 6 Modelli, 6 Accessori, 3 Coperture, 16 Biciclette, 2 Prenotazioni.`);
}

main()
  .catch((e) => {
    console.error('❌ Errore durante il seeding:', e)
    process.exit(1)
  })
  .finally(async () => {
    await pool.end()
  })