import { OpenApiGeneratorV3, OpenAPIRegistry } from "@asteasolutions/zod-to-openapi";
import { z } from "zod";
import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";
import { LoginSchema, RegisterSchema } from "./validators/auth";
import { UserResponseSchema } from "./validators/user";
import { PrenotazioneInputSchema } from "./validators/prenotazione";
import { BiciclettaResponseSchema } from "./validators/bicicletta";

// Estende Zod con il metodo .openapi() per aggiungere metadati agli schema
// come esempi e descrizioni visibili nella documentazione Swagger.
extendZodWithOpenApi(z);

// Contenitore centralizzato dove si registrano tutte le definizioni delle API.
// Raccoglie path, schema e security schemes — alla fine generateOpenApiDocument
// lo legge e genera il JSON che Swagger UI renderizza.
export const registry = new OpenAPIRegistry();

// Registra ogni endpoint con metodo, path, request body e responses.
// Swagger UI userà queste definizioni per renderizzare la pagina docs
// con i form interattivi per testare le API.
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
        "application/json": {
          schema: UserResponseSchema
        },
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
// BICICLETTE
// ==========================================

registry.registerPath({
  method: "get",
  path: "/api/bicicletta",
  tags: ["Biciclette"],
  summary: "Lista biciclette",
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

// ==========================================
// PRENOTAZIONI
// ==========================================

registry.registerPath({
  method: "post",
  path: "/api/prenotazione",
  tags: ["Prenotazioni"],
  summary: "Crea prenotazione",
  request: {
    body: {
      content: { "application/json": { schema: PrenotazioneInputSchema } },
    },
  },
  responses: {
    201: { description: "Prenotazione creata" },
    400: { description: "Dati non validi" },
    401: { description: "Non autorizzato" },
  },
});

// Legge tutto il registry e genera il documento JSON OpenAPI 3.0.
// Questo JSON viene servito da /api/openapi e dato in pasto a Swagger UI
// che lo renderizza come pagina interattiva per testare le API.
export function generateOpenApiDocument() {
  const generator = new OpenApiGeneratorV3(registry.definitions);
  return generator.generateDocument({
    openapi: "3.0.0",
    info: {
      title: "API",
      version: "1.0.0",
    },
    servers: [{ url: "http://localhost:3000" }],
  });
}