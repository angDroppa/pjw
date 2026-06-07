import { z } from "zod";
import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";
import { AlimentazioneSchema } from "./bicicletta";
import { LocationResponseSchema } from "./location";
import { SpecificheBiciclettaResponseSchema } from "./bicicletta";
import { AssicurazioneResponseSchema } from "./assicurazione";
import { AccessorioResponseSchema } from "./accessorio";
import { UserResponseSchema, UserResponseSchemaFlat } from "./user";

extendZodWithOpenApi(z);


export const StatoPrenotazioneSchema = z.enum([
  "PENDING", "PICKED_UP", "RETURNED", "LATE",
]).openapi({ example: "PENDING" });

// ==========================================
// INPUT
// ==========================================

export const PrenotazioneInputSchema = z.object({
  dataRitiro: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Formato data non valido").openapi({ example: "2025-06-01" }),
  oraRitiro: z.string().regex(/^\d{2}:\d{2}$/, "Formato ora non valido").openapi({ example: "10:00" }),
  dataConsegna: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Formato data non valido").openapi({ example: "2025-06-03" }),
  oraConsegna: z.string().regex(/^\d{2}:\d{2}$/, "Formato ora non valido").openapi({ example: "10:00" }),
  alimentazione: AlimentazioneSchema,
  note: z.string().optional().openapi({ example: "leggero ritardo" }),
  totalePagato: z.number().positive().openapi({ example: 100 }),
  biciclettaId: z.number().int().positive().openapi({ example: 1 }),
  locationId: z.number().int().positive().openapi({ example: 1 }),
  coperturaId: z.number().int().positive().openapi({ example: 1 }),
  accessoriIds: z.array(z.number().int().positive()).optional(),
}).refine(
  (data) => data.dataRitiro < data.dataConsegna,
  { message: "La data di consegna deve essere successiva alla data di ritiro", path: ["dataConsegna"] }
).openapi("PrenotazioneInput");

export const UpdatePrenotazioneSchema = z.object({
  stato: StatoPrenotazioneSchema.optional(),
  noteRiconsegna: z.string().optional().openapi({ example: "riconsegnata in orario" }),
  danni: z.string().optional().openapi({ example: "graffio sul telaio" }),
}).openapi("UpdatePrenotazione");

// ==========================================
// RESPONSE
// ==========================================

export const PrenotazioneResponseSchema = z.object({
  id: z.number().int().openapi({ example: 1 }),
  dataCreazione: z.string().openapi({ example: "2025-06-01T10:00:00.000Z" }),
  dataRitiro: z.string().openapi({ example: "2025-06-01" }),
  oraRitiro: z.string().openapi({ example: "10:00" }),
  dataConsegna: z.string().openapi({ example: "2025-06-03" }),
  oraConsegna: z.string().openapi({ example: "10:00" }),
  alimentazione: AlimentazioneSchema,
  stato: StatoPrenotazioneSchema,
  note: z.string().optional(),
  noteRiconsegna: z.string().optional(),
  danni: z.string().optional(),
  totalePagato: z.number().openapi({ example: 100 }),
  utente: UserResponseSchemaFlat,
  bicicletta: SpecificheBiciclettaResponseSchema,
  location: LocationResponseSchema,
  copertura: AssicurazioneResponseSchema,
  accessori: z.array(AccessorioResponseSchema),
}).openapi("PrenotazioneResponse");

export const UpdatePrenotazioneClienteSchema = z.object({
  dataRitiro:    z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  oraRitiro:     z.string().regex(/^\d{2}:\d{2}$/).optional(),
  dataConsegna:  z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  oraConsegna:   z.string().regex(/^\d{2}:\d{2}$/).optional(),
  alimentazione: AlimentazioneSchema.optional(),
  note:          z.string().optional(),
  totalePagato:  z.number().positive().optional(),
  biciclettaId:  z.number().int().positive().optional(),
  locationId:    z.number().int().positive().optional(),
  coperturaId:   z.number().int().positive().optional(),
  accessoriIds:  z.array(z.number().int().positive()).optional(),
}).openapi("UpdatePrenotazioneCliente");

export const PrenotazioneBatchItemSchema = z.object({
  biciclettaSpecificId: z.number().int().positive(),
  locationId: z.number().int().positive(),
  alimentazione: AlimentazioneSchema,
  dataRitiro: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  oraRitiro: z.string().regex(/^\d{2}:\d{2}$/),
  dataConsegna: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  oraConsegna: z.string().regex(/^\d{2}:\d{2}$/),
  coperturaId: z.number().int().positive(),
  accessoriIds: z.array(z.number().int().positive()).optional().default([]),
  totalePagato: z.number().positive(),
})

export const PrenotazioneBatchSchema = z.object({
  prenotazioni: z.array(PrenotazioneBatchItemSchema).min(1),
})

export type UpdatePrenotazioneCliente = z.infer<typeof UpdatePrenotazioneClienteSchema>;

// ==========================================
// TYPES
// ==========================================

export type PrenotazioneBatchItem = z.infer<typeof PrenotazioneBatchItemSchema>
export type PrenotazioneBatchInput = z.infer<typeof PrenotazioneBatchSchema>

export type PrenotazioneInput = z.infer<typeof PrenotazioneInputSchema>;
export type UpdatePrenotazione = z.infer<typeof UpdatePrenotazioneSchema>;
export type PrenotazioneResponse = z.infer<typeof PrenotazioneResponseSchema>;