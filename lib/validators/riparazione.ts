import { z } from "zod";
import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";
import { BiciclettaLocationResponseSchema } from "./biciclettaLocation";
import { PrenotazioneResponseSchema } from "./prenotazione";

extendZodWithOpenApi(z);

// ==========================================
// INPUT
// ==========================================

export const UpdateRiparazioneSchema = z.object({
  motivo: z.string().min(1).optional().openapi({ example: "Graffio sul telaio" }),
  costo: z.coerce.number().positive().optional().openapi({ example: 250.00 }),
  dataFine: z.coerce.date().optional().openapi({ example: "2025-06-10" }),
}).openapi("UpdateRiparazione");

// ==========================================
// RESPONSE
// ==========================================

export const RiparazioneResponseSchema = z.object({
  id: z.number().int().openapi({ example: 1 }),
  biciclettaLocationId: z.number().int().openapi({ example: 1 }),
  prenotazioneId: z.number().int().nullable().openapi({ example: 1 }),
  motivo: z.string().openapi({ example: "Graffio sul telaio" }),
  costo: z.coerce.number().nullable().openapi({ example: 250.00 }),
  aperta: z.boolean().openapi({ example: true }),
  dataInizio: z.string().openapi({ example: "2025-06-01T10:00:00.000Z" }),
  dataFine: z.string().nullable().openapi({ example: "2025-06-10T10:00:00.000Z" }),
  biciclettaLocation: BiciclettaLocationResponseSchema,
  prenotazione: PrenotazioneResponseSchema.nullable().optional(),
}).openapi("RiparazioneResponse");

export type UpdateRiparazione = z.infer<typeof UpdateRiparazioneSchema>;
export type RiparazioneResponse = z.infer<typeof RiparazioneResponseSchema>;