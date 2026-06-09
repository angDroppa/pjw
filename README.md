# BikeRent — Sistema di noleggio biciclette

Sistema web per la gestione del noleggio biciclette, sviluppato come **Project Work** (revisione 2026).  
Il servizio copre il flusso utente finale (catalogo, prenotazione, carrello, dashboard) e il pannello operativo per gli operatori (backoffice).

---

## Indice

- [Architettura](#architettura)
- [Stack tecnologico](#stack-tecnologico)
- [Funzionalità](#funzionalità)
- [Requisiti](#requisiti)
- [Avvio rapido](#avvio-rapido)
- [Credenziali di test](#credenziali-di-test)
- [Flussi da provare](#flussi-da-provare)
- [API e documentazione](#api-e-documentazione)
- [Struttura del progetto](#struttura-del-progetto)
- [Scelte progettuali e assunzioni](#scelte-progettuali-e-assunzioni)
- [Limitazioni ed evoluzioni future](#limitazioni-ed-evoluzioni-future)

---

## Architettura

Il sistema segue un'architettura **monolitica full-stack** basata su Next.js (App Router):

```
┌─────────────────────────────────────────────────────────────┐
│                        Client                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐  │
│  │ Catalogo web │  │   Carrello   │  │    Backoffice    │  │
│  │  (pubblico)  │  │  / Dashboard │  │    (admin)       │  │
│  └──────┬───────┘  └──────┬───────┘  └────────┬─────────┘  │
└─────────┼─────────────────┼──────────────────┼──────────┘
          │                 │                  │
          ▼                 ▼                  ▼
┌─────────────────────────────────────────────────────────────┐
│              Next.js — API Routes (REST)                    │
│  /api/bicicletta  /api/prenotazione  /api/backoffice  …   │
└─────────────────────────────┬───────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│           Prisma ORM  →  PostgreSQL (schema: new)           │
└─────────────────────────────────────────────────────────────┘
```

- **Frontend e backend** condividono lo stesso progetto Next.js; le API sono Route Handlers in `app/api/`.
- **Autenticazione** tramite JWT in cookie HttpOnly (`access_token`, `refresh_token`), con refresh automatico gestito da `proxy.ts`.
- **Validazione** input con Zod; contratti API documentati con OpenAPI/Swagger.

---

## Stack tecnologico

| Layer | Tecnologia |
|-------|------------|
| Framework | Next.js 16 (App Router) |
| Linguaggio | TypeScript |
| UI | React 19, Tailwind CSS 4, DaisyUI |
| ORM / DB | Prisma 7, PostgreSQL |
| Auth | JWT (`jose`), bcryptjs, cookie HttpOnly |
| Validazione | Zod + `@asteasolutions/zod-to-openapi` |
| Stato client | Zustand, TanStack React Query |
| HTTP client | Axios |
| Documentazione API | Swagger UI (`/docs`) |

---

## Funzionalità

### Implementate

| Area | Dettaglio |
|------|-----------|
| **Catalogo** | Biciclette per tipologia (City, Mountain, Gravel, Road), schede prodotto con taglie e range altezza |
| **Prenotazione** | Wizard a step: taglia, propulsione, date/orari (9:00–18:00), disponibilità per sede, accessori, assicurazione, riepilogo |
| **Carrello** | Prenotazione di più biciclette con configurazioni diverse |
| **Disponibilità** | Calcolo su stock per negozio, con controllo sovrapposizioni prenotazioni |
| **Dashboard utente** | Visualizzazione, modifica e cancellazione prenotazioni (fino a 2 giorni prima del ritiro) |
| **Backoffice** | Configurazione (sedi, accessori, assicurazioni, biciclette), gestione stock/manutenzione, prenotazioni operative, statistiche |
| **Auth** | Registrazione, login, logout, refresh token |

### Simulate

| Funzionalità | Meccanismo |
|--------------|------------|
| **Email di conferma prenotazione** | Record nella tabella `Notifica` (tipo `conferma_prenotazione`) |
| **Email modifica/cancellazione** | Record `Notifica` con tipo dedicato |
| **Comunicazioni** | API `GET /api/notifiche` — nessun invio email reale |

### Semplificate

| Aspetto | Scelta adottata |
|---------|-----------------|
| **Tariffazione** | Il totale usa `prezzoGiornata × giorni`; il listino espone anche `prezzoMezzaGiornata` ma non guida ancora il calcolo |
| **Pagamento** | Nessun gateway online; il pagamento avviene in negozio al ritiro (`totalePagato` registrato in prenotazione) |
| **Registrazione** | Account attivo subito dopo la registrazione; campi `verified` / `verificationToken` presenti nel DB ma non ancora usati nel flusso |

### Non ancora implementate (evoluzioni future)

- **App mobile** come client distinto (requisito del project work ancora da realizzare)
- **Attivazione account** via link email
- **Promemoria automatico** il giorno prima del ritiro (job schedulato)
- **UI notifiche** lato utente (l'API esiste, manca il pannello in interfaccia)
- **Segnalazione danni** strutturata in backoffice (campi `danni` / `noteRiconsegna` presenti nel modello)

---

## Requisiti

- **Node.js** 20+
- **PostgreSQL** 14+
- **npm** (o pnpm/yarn)

---

## Avvio rapido

### 1. Clona e installa le dipendenze

```bash
git clone <url-repository>
cd projectwork26
npm install
```

### 2. Configura le variabili d'ambiente

Crea un file `.env` nella root del progetto:

```env
DATABASE_URL="postgresql://USER:PASSWORD@localhost:5432/bikerent?schema=new"
JWT_SECRET="una-stringa-segreta-lunga-per-access-token"
JWT_REFRESH_SECRET="un-altra-stringa-segreta-per-refresh-token"
```

> Il database usa lo schema PostgreSQL `new` (definito in `prisma/schema.prisma`).

### 3. Prepara il database

```bash
npx prisma migrate dev
npx prisma db seed
```

Il seed popola: ruoli, utenti, 4 punti vendita, catalogo biciclette, stock, accessori, assicurazioni e prenotazioni di esempio.

### 4. Avvia il server di sviluppo

```bash
npm run dev
```

Apri [http://localhost:3000](http://localhost:3000).

### Comandi utili

| Comando | Descrizione |
|---------|-------------|
| `npm run dev` | Server di sviluppo |
| `npm run build` | Build di produzione |
| `npm run start` | Avvio in produzione |
| `npm run lint` | ESLint |
| `npx prisma studio` | GUI per esplorare il database |
| `npx prisma db seed` | Ripopola dati di test |

---

## Credenziali di test

Dopo il seed:

| Ruolo | Email | Password |
|-------|-------|----------|
| **Admin** | `admin@bikerent.com` | `Password123!` |
| **Cliente** | `mario.rossi@gmail.com` (e altri nel seed) | `Password123!` |

---

## Flussi da provare

### Utente finale

1. Apri `/` e sfoglia il catalogo biciclette.
2. Clicca su una bici → wizard di configurazione (taglia, date, sede, accessori, assicurazione).
3. Aggiungi al carrello → vai su `/carrello` (richiede login).
4. Conferma le prenotazioni.
5. Vai su `/dashboard` per vedere, modificare o cancellare le prenotazioni.

### Operatore (admin)

1. Accedi con `admin@bikerent.com`.
2. Vai su `/backoffice/config` — gestisci sedi, accessori, assicurazioni.
3. `/backoffice/biciclette` — catalogo e specifiche (taglie, prezzi, altezza).
4. `/backoffice/stock` — inventario per negozio e manutenzione.
5. `/backoffice/prenotazioni` — ricerca, ritiro (✅), riconsegna (🔄), ritardo (⚠️).
6. `/backoffice/statistiche` — prenotazioni, ricavi, performance negozi.

---

## API e documentazione

- **Swagger UI interattivo:** [http://localhost:3000/docs](http://localhost:3000/docs)
- **Spec OpenAPI JSON:** `GET /api/openapi`

### Endpoint principali

| Metodo | Path | Descrizione |
|--------|------|-------------|
| `GET` | `/api/bicicletta` | Catalogo biciclette |
| `GET` | `/api/disponibilita` | Disponibilità per sede e date |
| `POST` | `/api/prenotazione` | Crea prenotazione singola |
| `POST` | `/api/prenotazione/batch` | Conferma carrello |
| `GET/PATCH/DELETE` | `/api/prenotazione/[id]` | Gestione prenotazione utente |
| `GET` | `/api/notifiche` | Notifiche simulate dell'utente |
| `GET/POST` | `/api/backoffice` | Operazioni backoffice (auth richiesta) |
| `POST` | `/api/auth/login` | Login |
| `POST` | `/api/auth/register` | Registrazione |

Le route protette usano cookie HttpOnly; le chiamate dal browser includono automaticamente le credenziali (`credentials: include`).

---

## Struttura del progetto

```
projectwork26/
├── app/
│   ├── (protected)/          # Pagine autenticate (dashboard, backoffice)
│   ├── api/                  # Route Handlers REST
│   ├── components/           # UI condivisa (wizard, form, navbar)
│   ├── carrello/             # Carrello prenotazioni
│   ├── details/[id]/         # Scheda prodotto
│   ├── docs/                 # Swagger UI
│   ├── login/ | register/    # Auth pages
│   └── page.tsx              # Homepage catalogo
├── lib/
│   ├── auth/                 # JWT, cookie, sessione
│   ├── axios/                # Client HTTP per le API
│   ├── disponibilita/        # Logica disponibilità
│   ├── validators/           # Schemi Zod
│   └── store/                # Zustand stores
├── prisma/
│   ├── schema.prisma         # Modello dati
│   ├── seed.ts               # Dati di test
│   └── migrations/
└── proxy.ts                  # Middleware auth e protezione route
```

---

## Scelte progettuali e assunzioni

### Modello dati

- **`Bicicletta`** rappresenta il modello (es. "City Bike Classic") con tipologia fissa (`CITY`, `MOUNTAIN`, `GRAVEL`, `ROAD`).
- **`SpecificheBicicletta`** rappresenta la variante per taglia (S/M/L/XL) con prezzi e range altezza consigliato.
- **`Alimentazione`** (muscolare/elettrica) è un attributo della **prenotazione**, non della bicicletta: lo stesso modello può essere noleggiato in entrambe le versioni, con stock separato per negozio.
- **`BiciclettaLocation`** tiene traccia dello stock per sede (`quantitaMuscolare`, `quantitaElettrica`, gestione manutenzione).

### Disponibilità

La disponibilità si calcola come: *stock in sede − prenotazioni sovrapposte* (stati diversi da `RETURNED` e `LATE`). Gli accessori sono considerati a disponibilità illimitata, come da specifica.

### Autenticazione

- Cookie HttpOnly per evitare esposizione dei token al JavaScript client.
- `proxy.ts` intercetta le richieste, verifica/refresha i token e inietta `x-user-id` / `x-user-role` negli header per i Route Handler.
- Il backoffice è accessibile solo al ruolo `ADMIN`.

### Carrello

Il carrello è gestito in **localStorage** lato client fino alla conferma; la conferma invia un batch atomico al server, che verifica la disponibilità di tutte le righe prima di creare le prenotazioni.

### Assicurazioni

Tre coperture come da specifica del committente:
- **Assicurazione Base** — danni fino a 200 €
- **Servizio di Emergenza** — recupero entro 50 km
- **Kasko** — copertura completa

---

## Limitazioni ed evoluzioni future

| Priorità | Evoluzione |
|----------|------------|
| Alta | App mobile (React Native / Expo) come secondo client |
| Alta | Documentazione attivazione account e promemoria pre-ritiro |
| Media | Calcolo tariffa basato su mezze giornate |
| Media | Pannello notifiche utente e invio email simulato (log/console) |
| Bassa | Gestione operatori e audit log in backoffice |
| Bassa | Integrazione pagamenti online |

---

## Licenza

Progetto didattico — uso interno al percorso formativo.
