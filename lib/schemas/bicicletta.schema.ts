import { z } from 'zod'
import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi'
import { ModelloSchema } from './modello.schema'
import { TipologiaSchema } from './tipologia.schema'

extendZodWithOpenApi(z)

/**
 * -------------------------
 * DIMENSIONE (senza bicicletta dentro)
 * -------------------------
 */
export const DimensioneSchema = z.object({
  id: z.number().openapi({ example: 1 }),
  biciclettaId: z.number().openapi({ example: 1 }),
  taglia: z.string().openapi({ example: 'S' }),
  numeroBiciclette: z.number().openapi({ example: 5 }),
})

/**
 * -------------------------
 * BICICLETTA (con array dimensioni)
 * -------------------------
 */
export const BiciclettaSchema = z.object({
  id: z.number().openapi({ example: 1 }),
  modello: ModelloSchema,
  tipologia: TipologiaSchema,

  // 👇 QUESTO è quello che volevi
  dimensioni: z.array(
    DimensioneSchema.omit({ biciclettaId: true })
  ),
})

/**
 * -------------------------
 * INPUT
 * -------------------------
 */
export const BiciclettaInputSchema = z.object({
  modelloId: z.number().openapi({ example: 1 }),
  tipologiaId: z.number().openapi({ example: 1 }),
})

export const CreateBiciclettaSchema = BiciclettaInputSchema
export const UpdateBiciclettaSchema = BiciclettaInputSchema

/**
 * -------------------------
 * TYPES
 * -------------------------
 */
export type Bicicletta = z.infer<typeof BiciclettaSchema>
export type CreateBicicletta = z.infer<typeof CreateBiciclettaSchema>
export type UpdateBicicletta = z.infer<typeof UpdateBiciclettaSchema>