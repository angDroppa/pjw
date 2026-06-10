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

// Estende Zod con il metodo .openapi() per aggiungere metadati agli schema
extendZodWithOpenApi(z);

// Contenitore centralizzato dove si registrano tutte le definizioni delle API
export const registry = new OpenAPIRegistry();

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
  responses: {
    200: { description: "Logout effettuato" },
  },
});

registry.registerPath({
  method: "post",
  path: "/api/auth/refresh",
  tags: ["Auth"],
  summary: "Rinnova access token",
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
  method: "post",
  path: "/api/prenotazione",
  tags: ["Prenotazioni"],
  summary: "Crea una prenotazione singola",
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
  path: "/api/backoffice/locations", 
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
  path: "/api/backoffice/locations",
  tags: ["Backoffice — Configurazione"],
  summary: "Crea una nuova sede",
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
  path: "/api/backoffice/accessori",
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
  path: "/api/backoffice/accessori",
  tags: ["Backoffice — Configurazione"],
  summary: "Crea un nuovo accessorio",
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
  path: "/api/backoffice/assicurazioni",
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
  path: "/api/backoffice/assicurazioni",
  tags: ["Backoffice — Configurazione"],
  summary: "Crea una nuova assicurazione",
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

// --- Operatività Noleggi ---
registry.registerPath({
  method: "patch",
  path: "/api/backoffice/prenotazioni/{id}",
  tags: ["Backoffice — Operativo"],
  summary: "Gestione stato ed esito noleggio",
  description: "Utilizzato in negozio per registrare il ritiro (PICKED_UP), riconsegna (RETURNED), ritardi (LATE), note o danni al mezzo.",
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
    servers: [{ url: "http://localhost:3000" }],
  });
}