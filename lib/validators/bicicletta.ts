import { z } from "zod";
import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";

extendZodWithOpenApi(z);

export const TipologiaBiciclettaSchema = z.enum([
  "CITY", "MOUNTAIN", "GRAVEL", "ROAD",
]).openapi({ example: "CITY" });

export const AlimentazioneSchema = z.enum([
  "MUSCOLARE", "ELETTRICA",
]).openapi({ example: "ELETTRICA" });

// ==========================================
// SPECIFICHE
// ==========================================

export const SpecificheBiciclettaResponseSchema = z.object({
  id: z.number().int().openapi({ example: 1 }),
  size: z.string().openapi({ example: "L" }),
  prezzoGiornata: z.number().openapi({ example: 29.99 }),
  prezzoMezzaGiornata: z.number().openapi({ example: 17.99 }),
  altezzaMin: z.number().int().optional().openapi({ example: 160 }),
  altezzaMax: z.number().int().optional().openapi({ example: 185 }),
  biciclettaId: z.number().int().openapi({ example: 1 }),
}).openapi("SpecificheBiciclettaResponse");

export const CreateSpecificheSchema = z.object({
  size: z.string().min(1).openapi({ example: "L" }),
  prezzoGiornata: z.number().positive().openapi({ example: 29.99 }),
  prezzoMezzaGiornata: z.number().positive().openapi({ example: 17.99 }),
  altezzaMin: z.number().int().positive().optional().openapi({ example: 160 }),
  altezzaMax: z.number().int().positive().optional().openapi({ example: 185 }),
  biciclettaId: z.number().int().positive().openapi({ example: 1 }),
}).refine(
  (data) => data.altezzaMin == null || data.altezzaMax == null || data.altezzaMin < data.altezzaMax,
  { message: "altezzaMin deve essere minore di altezzaMax", path: ["altezzaMin"] }
).openapi("CreateSpecifiche");

export const UpdateSpecificheSchema = z.object({
  size: z.string().min(1).optional().openapi({ example: "XL" }),
  prezzoGiornata: z.number().positive().optional().openapi({ example: 34.99 }),
  prezzoMezzaGiornata: z.number().positive().optional().openapi({ example: 19.99 }),
  altezzaMin: z.number().int().positive().optional().openapi({ example: 175 }),
  altezzaMax: z.number().int().positive().optional().openapi({ example: 200 }),
}).openapi("UpdateSpecifiche");

// ==========================================
// BICICLETTA
// ==========================================

export const BiciclettaResponseSchema = z.object({
  id: z.number().int().openapi({ example: 1 }),
  nome: z.string().openapi({ example: "Trek Marlin 7" }),
  tipologia: TipologiaBiciclettaSchema,
  specifics: z.array(SpecificheBiciclettaResponseSchema),
}).openapi("BiciclettaResponse");

export const CreateBiciclettaSchema = z.object({
  nome: z.string().min(1).openapi({ example: "Trek Marlin 7" }),
  tipologia: TipologiaBiciclettaSchema,
  specifics: z.array(CreateSpecificheSchema).min(1).openapi({
    example: [{ size: "M", prezzoGiornata: 24.99, prezzoMezzaGiornata: 14.99 }],
  }),
}).openapi("CreateBicicletta");

export const UpdateBiciclettaSchema = z.object({
  nome: z.string().min(1).optional().openapi({ example: "Trek Marlin 8" }),
  tipologia: TipologiaBiciclettaSchema.optional(),
}).openapi("UpdateBicicletta");

// ==========================================
// TYPES
// ==========================================

export type BiciclettaResponse = z.infer<typeof BiciclettaResponseSchema>;
export type SpecificheBiciclettaResponse = z.infer<typeof SpecificheBiciclettaResponseSchema>;
export type CreateBicicletta = z.infer<typeof CreateBiciclettaSchema>;
export type UpdateBicicletta = z.infer<typeof UpdateBiciclettaSchema>;
export type CreateSpecifiche = z.infer<typeof CreateSpecificheSchema>;
export type UpdateSpecifiche = z.infer<typeof UpdateSpecificheSchema>;