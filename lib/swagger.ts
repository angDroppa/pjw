import { OpenApiGeneratorV3, OpenAPIRegistry } from "@asteasolutions/zod-to-openapi";
import { z } from "zod";
import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";

// Import dei Validatori
import { LoginSchema, RegisterSchema } from "./validators/auth";
import { UserResponseSchema } from "./validators/user";
import { BiciclettaResponseSchema } from "./validators/bicicletta";
import { LocationResponseSchema, CreateLocationSchema } from "./validators/location";
import { AccessorioResponseSchema, CreateAccessorioSchema } from "./validators/accessorio";
import { AssicurazioneResponseSchema, CreateAssicurazioneSchema } from "./validators/assicurazione";
import { 
  PrenotazioneInputSchema, 
  PrenotazioneResponseSchema, 
  UpdatePrenotazioneClienteSchema, 
  UpdatePrenotazioneSchema, 
  PrenotazioneBatchSchema 
} from "./validators/prenotazione";
import { DisponibilitaQuerySchema, DisponibilitaResponseSchema } from "./validators/biciclettaLocation";
import { RiparazioneResponseSchema, UpdateRiparazioneSchema } from "./validators/riparazione";

// Estende Zod con il metodo .openapi() per aggiungere metadati agli schema
extendZodWithOpenApi(z);

// Contenitore centralizzato dove si registrano tutte le definizioni delle API
export const registry = new OpenAPIRegistry();

registry.registerComponent("securitySchemes", "CookieAuth", {
  type: "apiKey",
  in: "cookie",
  name: "access_token",
  description: "Cookie di sessione httpOnly (access_token) ottenuto dopo il login.",
});

// ==========================================
// 1. AUTH & USERS
// ==========================================

registry.registerPath({
  method: "post",
  path: "/api/auth/login",
  tags: ["Auth"],
  summary: "Login utente",
  request: {
    body: {
      content: { "application/json": { schema: LoginSchema } },
    },
  },
  responses: {
    200: {
      description: "Login effettuato, cookie settati",
      content: {
        "application/json": { schema: UserResponseSchema },
      },
    },
    401: { description: "Credenziali non valide" },
  },
});

registry.registerPath({
  method: "post",
  path: "/api/auth/register",
  tags: ["Auth"],
  summary: "Registrazione utente",
  request: {
    body: {
      content: { "application/json": { schema: RegisterSchema } },
    },
  },
  responses: {
    201: { description: "Utente creato" },
    409: { description: "Email già in uso" },
  },
});

registry.registerPath({
  method: "post",
  path: "/api/auth/logout",
  tags: ["Auth"],
  summary: "Logout utente",
  security: [{ CookieAuth: [] }],
  responses: {
    200: { description: "Logout effettuato" },
  },
});

registry.registerPath({
  method: "post",
  path: "/api/auth/refresh",
  tags: ["Auth"],
  summary: "Rinnova access token",
  security: [{ CookieAuth: [] }],
  responses: {
    200: { description: "Token rinnovato" },
    401: { description: "Refresh token non valido o scaduto" },
  },
});

registry.registerPath({
  method: "get",
  path: "/api/users/me",
  tags: ["Users"],
  summary: "Utente corrente",
  security: [{ CookieAuth: [] }],
  responses: {
    200: {
      description: "Dati utente loggato",
      content: {
        "application/json": {
          schema: z.object({
            user: z.object({
              id: z.number(),
              firstName: z.string(),
              lastName: z.string(),
              email: z.string(),
              roleName: z.string(),
            }),
          }),
        },
      },
    },
    401: { description: "Non autorizzato" },
  },
});

registry.registerPath({
  method: "get",
  path: "/api/auth/verify",
  tags: ["Auth"],
  summary: "Verifica email utente",
  description: "Verifica l'indirizzo email dell'utente tramite token ricevuto via email.",
  request: {
    query: z.object({
      token: z.string().openapi({ description: "Token di verifica ricevuto via email" }),
    }),
  },
  responses: {
    302: { description: "Redirect a /verify?success=true o /verify?error=..." },
  },
});

// ==========================================
// 2. CORE / FLUSSO CLIENTE (Bici & Prenotazioni)
// ==========================================

registry.registerPath({
  method: "get",
  path: "/api/bicicletta",
  tags: ["Biciclette"],
  summary: "Lista biciclette",
  description: "Mostra il catalogo delle biciclette con le relative specifiche",
  responses: {
    200: {
      description: "Lista biciclette con specifiche",
      content: {
        "application/json": {
          schema: z.object({ biciclette: z.array(BiciclettaResponseSchema) }),
        },
      },
    },
  },
});

registry.registerPath({
  method: "get",
  path: "/api/bicicletta/{id}",
  tags: ["Biciclette"],
  summary: "Dettaglio bicicletta",
  description: "Mostra i dettagli di una specifica bicicletta con le sue specifiche",
  request: {
    params: z.object({ id: z.string().openapi({ description: "ID della bicicletta" }) }),
  },
  responses: {
    200: {
      description: "Dettaglio bicicletta",
      content: {
        "application/json": {
          schema: BiciclettaResponseSchema,
        },
      },
    },
    404: { description: "Bicicletta non trovata" },
  },
});

registry.registerPath({
  method: "get",
  path: "/api/prenotazione",
  tags: ["Prenotazioni"],
  summary: "Lista delle prenotazioni dell'utente corrente",
  security: [{ CookieAuth: [] }],
  responses: {
    200: {
      description: "Elenco delle prenotazioni dell'utente loggato",
      content: {
        "application/json": {
          schema: z.array(PrenotazioneResponseSchema),
        },
      },
    },
    401: { description: "Non autorizzato" },
  },
});

registry.registerPath({
  method: "post",
  path: "/api/prenotazione",
  tags: ["Prenotazioni"],
  summary: "Crea una prenotazione singola",
  security: [{ CookieAuth: [] }],
  request: {
    body: {
      content: { "application/json": { schema: PrenotazioneInputSchema } },
    },
  },
  responses: {
    201: { description: "Prenotazione creata con successo" },
    400: { description: "Dati di input non validi" },
    401: { description: "Non autorizzato" },
  },
});

registry.registerPath({
  method: "post",
  path: "/api/prenotazione/batch",
  tags: ["Prenotazioni"],
  summary: "Conferma carrello (Prenotazione multipla)",
  description: "Invia un batch di prenotazioni dal carrello. Il sistema verifica la disponibilità in modo atomico.",
  security: [{ CookieAuth: [] }],
  request: {
    body: {
      content: { "application/json": { schema: PrenotazioneBatchSchema } },
    },
  },
  responses: {
    201: { description: "Tutte le prenotazioni del carrello sono state create" },
    400: { description: "Errore di disponibilità o dati non validi" },
    401: { description: "Non autorizzato" },
  },
});

registry.registerPath({
  method: "get",
  path: "/api/prenotazione/{id}",
  tags: ["Prenotazioni"],
  summary: "Ottieni i dettagli di una specifica prenotazione",
  security: [{ CookieAuth: [] }],
  request: {
    params: z.object({ id: z.string().openapi({ description: "ID della prenotazione" }) }),
  },
  responses: {
    200: {
      description: "Dettaglio prenotazione recuperato",
      content: {
        "application/json": { schema: PrenotazioneResponseSchema },
      },
    },
    401: { description: "Non autorizzato" },
    404: { description: "Prenotazione non trovata" },
  },
});

registry.registerPath({
  method: "patch",
  path: "/api/prenotazione/{id}",
  tags: ["Prenotazioni"],
  summary: "Modifica una prenotazione (Utente/Cliente)",
  description: "Permette al cliente di modificare i dettagli del noleggio (Fino a 2 giorni prima del ritiro).",
  security: [{ CookieAuth: [] }],
  request: {
    params: z.object({ id: z.string() }),
    body: {
      content: { "application/json": { schema: UpdatePrenotazioneClienteSchema } },
    },
  },
  responses: {
    200: { description: "Prenotazione aggiornata con successo" },
    400: { description: "Impossibile modificare (es. mancano meno di 2 giorni al ritiro) o dati non validi" },
    401: { description: "Non autorizzato" },
  },
});

registry.registerPath({
  method: "delete",
  path: "/api/prenotazione/{id}",
  tags: ["Prenotazioni"],
  summary: "Cancella/Annulla una prenotazione",
  description: "Permette al cliente di eliminare la prenotazione (Fino a 2 giorni prima del ritiro).",
  security: [{ CookieAuth: [] }],
  request: {
    params: z.object({ id: z.string() }),
  },
  responses: {
    200: { description: "Prenotazione cancellata con successo" },
    400: { description: "Impossibile cancellare (es. termine di 2 giorni superato)" },
    401: { description: "Non autorizzato" },
  },
});

// ==========================================
// 3. BACKOFFICE & CONFIGURAZIONE (Admin Only)
// ==========================================

// --- Locations ---
registry.registerPath({
  method: "get",
  path: "/api/locations", 
  tags: ["Backoffice — Configurazione"],
  summary: "Lista di tutte le sedi",
  responses: {
    200: {
      description: "Lista delle sedi recuperata con successo",
      content: {
        "application/json": {
          schema: z.object({ locations: z.array(LocationResponseSchema) }),
        },
      },
    },
  },
});

registry.registerPath({
  method: "post",
  path: "/api/locations",
  tags: ["Backoffice — Configurazione"],
  summary: "Crea una nuova sede",
  security: [{ CookieAuth: [] }],
  request: {
    body: {
      content: { "application/json": { schema: CreateLocationSchema } },
    },
  },
  responses: {
    201: { description: "Sede creata con successo" },
    400: { description: "Dati di input non validi" },
    401: { description: "Non autorizzato" },
    403: { description: "Vietato (Richiede ruolo ADMIN)" },
  },
});

// --- Accessori ---
registry.registerPath({
  method: "get",
  path: "/api/accessori",
  tags: ["Backoffice — Configurazione"],
  summary: "Lista di tutti gli accessori disponibili",
  responses: {
    200: {
      description: "Lista degli accessori recuperata con successo",
      content: {
        "application/json": {
          schema: z.object({ accessori: z.array(AccessorioResponseSchema) }),
        },
      },
    },
  },
});

registry.registerPath({
  method: "post",
  path: "/api/accessori",
  tags: ["Backoffice — Configurazione"],
  summary: "Crea un nuovo accessorio",
  security: [{ CookieAuth: [] }],
  request: {
    body: {
      content: { "application/json": { schema: CreateAccessorioSchema } },
    },
  },
  responses: {
    201: { description: "Accessorio creato con successo" },
    400: { description: "Dati di input non validi" },
    401: { description: "Non autorizzato" },
    403: { description: "Vietato (Richiede ruolo ADMIN)" },
  },
});

// --- Assicurazioni ---
registry.registerPath({
  method: "get",
  path: "/api/assicurazioni",
  tags: ["Backoffice — Configurazione"],
  summary: "Lista di tutte le coperture assicurative",
  responses: {
    200: {
      description: "Lista delle assicurazioni recuperata con successo",
      content: {
        "application/json": {
          schema: z.object({ assicurazioni: z.array(AssicurazioneResponseSchema) }),
        },
      },
    },
  },
});

registry.registerPath({
  method: "post",
  path: "/api/assicurazioni",
  tags: ["Backoffice — Configurazione"],
  summary: "Crea una nuova assicurazione",
  security: [{ CookieAuth: [] }],
  request: {
    body: {
      content: { "application/json": { schema: CreateAssicurazioneSchema } },
    },
  },
  responses: {
    201: { description: "Assicurazione creata con successo" },
    400: { description: "Dati di input non validi" },
    401: { description: "Non autorizzato" },
    403: { description: "Vietato (Richiede ruolo ADMIN)" },
  },
});

// --- Disponibilità ---
registry.registerPath({
  method: "get",
  path: "/api/disponibilita",
  tags: ["Disponibilità"],
  summary: "Verifica disponibilità biciclette",
  description: "Controlla la disponibilità delle biciclette per data, ora, location e alimentazione.",
  request: {
    query: DisponibilitaQuerySchema,
  },
  responses: {
    200: {
      description: "Disponibilità calcolata",
      content: {
        "application/json": {
          schema: z.object({ disponibilita: z.array(DisponibilitaResponseSchema) }),
        },
      },
    },
    400: { description: "Parametri di query non validi" },
  },
});

// --- Notifiche ---
registry.registerPath({
  method: "get",
  path: "/api/notifiche",
  tags: ["Notifiche"],
  summary: "Lista notifiche utente",
  description: "Restituisce le ultime 50 notifiche dell'utente loggato.",
  security: [{ CookieAuth: [] }],
  responses: {
    200: {
      description: "Lista delle notifiche",
      content: {
        "application/json": {
          schema: z.array(z.object({
            id: z.number().int(),
            messaggio: z.string(),
            tipo: z.string(),
            sentAt: z.string(),
            letto: z.boolean(),
            utenteId: z.number().int(),
          })),
        },
      },
    },
    401: { description: "Non autorizzato" },
  },
});

registry.registerPath({
  method: "patch",
  path: "/api/notifiche",
  tags: ["Notifiche"],
  summary: "Segna notifica come letta",
  description: "Segna una specifica notifica come letta (se notificaId è presente) oppure tutte le notifiche dell'utente.",
  security: [{ CookieAuth: [] }],
  request: {
    body: {
      content: {
        "application/json": {
          schema: z.object({
            notificaId: z.number().int().optional().openapi({ description: "ID della notifica (opzionale: se omesso, segna tutte come lette)" }),
          }),
        },
      },
    },
  },
  responses: {
    200: { description: "Notifiche aggiornate" },
    401: { description: "Non autorizzato" },
  },
});

// --- Riparazioni ---
registry.registerPath({
  method: "get",
  path: "/api/riparazioni",
  tags: ["Riparazioni"],
  summary: "Lista riparazioni",
  security: [{ CookieAuth: [] }],
  responses: {
    200: {
      description: "Lista delle riparazioni",
      content: {
        "application/json": {
          schema: z.object({ riparazioni: z.array(RiparazioneResponseSchema) }),
        },
      },
    },
    401: { description: "Non autorizzato" },
  },
});

registry.registerPath({
  method: "patch",
  path: "/api/riparazioni/{id}",
  tags: ["Riparazioni"],
  summary: "Aggiorna una riparazione",
  description: "Aggiorna motivo, costo o dataFine di una riparazione esistente.",
  security: [{ CookieAuth: [] }],
  request: {
    params: z.object({ id: z.string().openapi({ description: "ID della riparazione" }) }),
    body: {
      content: { "application/json": { schema: UpdateRiparazioneSchema } },
    },
  },
  responses: {
    200: { description: "Riparazione aggiornata" },
    400: { description: "ID non valido" },
    401: { description: "Non autorizzato" },
    404: { description: "Riparazione non trovata" },
    422: { description: "Dati non validi" },
  },
});

registry.registerPath({
  method: "put",
  path: "/api/riparazioni/{id}",
  tags: ["Riparazioni"],
  summary: "Chiudi riparazione",
  description: "Chiude una riparazione aperta, riconteggiando lo stock della bicicletta.",
  security: [{ CookieAuth: [] }],
  request: {
    params: z.object({ id: z.string().openapi({ description: "ID della riparazione" }) }),
  },
  responses: {
    200: { description: "Riparazione chiusa con successo" },
    400: { description: "ID non valido" },
    401: { description: "Non autorizzato" },
    404: { description: "Riparazione non trovata" },
    422: { description: "Riparazione già chiusa" },
  },
});

// --- Backoffice ---
registry.registerPath({
  method: "get",
  path: "/api/backoffice",
  tags: ["Backoffice"],
  summary: "Operazioni GET di backoffice",
  description: "Esegue azioni di backoffice in base al parametro action:\n- `stock` → stock biciclette per negozio\n- `config` → configurazione (negozi, accessori, assicurazioni)\n- `prenotazioni` → lista prenotazioni (filtri: utente, data, locationId)\n- `catalogo` → biciclette e negozi\n- `statistiche` → statistiche noleggi (filtri: da, a)",
  security: [{ CookieAuth: [] }],
  request: {
    query: z.object({
      action: z.enum(["stock", "config", "prenotazioni", "catalogo", "statistiche"]),
      utente: z.string().optional(),
      data: z.string().optional(),
      locationId: z.string().optional(),
      da: z.string().optional(),
      a: z.string().optional(),
    }),
  },
  responses: {
    200: { description: "Risultato dell'azione richiesta" },
    400: { description: "Azione non valida" },
    401: { description: "Non autorizzato" },
  },
});

registry.registerPath({
  method: "post",
  path: "/api/backoffice",
  tags: ["Backoffice"],
  summary: "Operazioni POST di backoffice",
  description: "Esegue azioni di backoffice in base al campo action nel body:\n- `create_location` / `update_location` / `delete_location`\n- `create_accessorio` / `update_accessorio` / `delete_accessorio`\n- `create_assicurazione` / `update_assicurazione` / `delete_assicurazione`\n- `create_bicicletta` / `delete_bicicletta`\n- `create_specifica` / `update_specifica` / `delete_specifica`\n- `aggiungi_bici_negozio` / `update_stock`\n- `update_stato_prenotazione`\n- `send_reminders`",
  security: [{ CookieAuth: [] }],
  responses: {
    200: { description: "Azione completata con successo" },
    201: { description: "Risorsa creata con successo" },
    400: { description: "Dati non validi o azione sconosciuta" },
    401: { description: "Non autorizzato" },
    404: { description: "Risorsa non trovata" },
  },
});

// --- Operatività Noleggi ---
registry.registerPath({
  method: "patch",
  path: "/api/prenotazione/{id}",
  tags: ["Backoffice — Operativo"],
  summary: "Gestione stato ed esito noleggio",
  description: "Utilizzato in negozio per registrare il ritiro (PICKED_UP), riconsegna (RETURNED), ritardi (LATE), note o danni al mezzo.",
  security: [{ CookieAuth: [] }],
  request: {
    params: z.object({ id: z.string() }),
    body: {
      content: { "application/json": { schema: UpdatePrenotazioneSchema } },
    },
  },
  responses: {
    200: { description: "Stato della prenotazione aggiornato dal personale operativo" },
    401: { description: "Non autorizzato" },
    403: { description: "Vietato (Richiede ruolo ADMIN)" },
  },
});

// ==========================================
// GENERAZIONE DOCUMENTO OPENAPI
// ==========================================

export function generateOpenApiDocument() {
  const generator = new OpenApiGeneratorV3(registry.definitions);
  return generator.generateDocument({
    openapi: "3.0.0",
    info: {
      title: "BikeRent API Documentation",
      version: "1.0.0",
      description: "Documentazione interattiva delle API per il sistema di noleggio biciclette BikeRent (Project Work 2026).",
    },
    servers: [{ url: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000" }],
  });
}