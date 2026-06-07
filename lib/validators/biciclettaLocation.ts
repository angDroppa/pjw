import { z } from "zod";
import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";
import { LocationResponseSchema } from "./location";
import { SpecificheBiciclettaResponseSchema } from "./bicicletta";

extendZodWithOpenApi(z);

export const BiciclettaLocationResponseSchema = z.object({
  id: z.number().int().openapi({ example: 1 }),
  locationId: z.number().int().openapi({ example: 1 }),
  biciclettaSpecificId: z.number().int().openapi({ example: 1 }),
  quantitaMuscolare: z.number().int().openapi({ example: 5 }),
  quantitaElettrica: z.number().int().openapi({ example: 3 }),
  location: LocationResponseSchema,
  biciclettaSpecific: SpecificheBiciclettaResponseSchema,
}).openapi("BiciclettaLocationResponse");

export const CreateBiciclettaLocationSchema = z.object({
  locationId: z.number().int().positive().openapi({ example: 1 }),
  biciclettaSpecificId: z.number().int().positive().openapi({ example: 1 }),
  quantitaMuscolare: z.number().int().min(0).openapi({ example: 5 }),
  quantitaElettrica: z.number().int().min(0).openapi({ example: 3 }),
}).openapi("CreateBiciclettaLocation");

export const UpdateBiciclettaLocationSchema = z.object({
  quantitaMuscolare: z.number().int().min(0).optional().openapi({ example: 5 }),
  quantitaElettrica: z.number().int().min(0).optional().openapi({ example: 3 }),
}).openapi("UpdateBiciclettaLocation");

// Usato per la disponibilità nel configuratore
export const DisponibilitaResponseSchema = z.object({
  locationId:          z.number().int(),
  location:            LocationResponseSchema,
  biciclettaSpecificId: z.number().int(),
  biciclettaSpecific:  SpecificheBiciclettaResponseSchema,
  disponibile:         z.number().int(), // quantità per l'alimentazione scelta
}).openapi("DisponibilitaResponse");

export const DisponibilitaQuerySchema = z.object({
  dataRitiro:    z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Formato data non valido"),
  oraRitiro:     z.string().regex(/^\d{2}:\d{2}$/, "Formato ora non valido"),
  dataConsegna:  z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Formato data non valido"),
  oraConsegna:   z.string().regex(/^\d{2}:\d{2}$/, "Formato ora non valido"),
  biciclettaId:  z.number().int().positive(),
  size:          z.string(),
  alimentazione: z.enum(["MUSCOLARE", "ELETTRICA"]),
}).openapi("DisponibilitaQuery");

export type BiciclettaLocationResponse = z.infer<typeof BiciclettaLocationResponseSchema>;
export type CreateBiciclettaLocation = z.infer<typeof CreateBiciclettaLocationSchema>;
export type UpdateBiciclettaLocation = z.infer<typeof UpdateBiciclettaLocationSchema>;
export type DisponibilitaResponse = z.infer<typeof DisponibilitaResponseSchema>;
export type DisponibilitaQuery = z.infer<typeof DisponibilitaQuerySchema>;