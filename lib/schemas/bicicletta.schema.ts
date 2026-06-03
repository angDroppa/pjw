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
 * BICICLETTA (Modello Finale di Output)
 * -------------------------
 */
export const BiciclettaSchema = z.object({
  id: z.number().openapi({ example: 1 }),
  modelloId: z.number().openapi({ example: 1 }),
  modello: ModelloSchema,
  
  // 1. MODIFICATO: Ora è un array di tipologie (Many-to-Many)
  tipologie: z.array(TipologiaSchema),

  // 2. AGGIUNTO: Nuovi campi quantità obbligatori (senza accenti)
  quantitaElettrico: z.number().openapi({ example: 5 }),
  quantitaMuscolare: z.number().openapi({ example: 3 }),

  // L'array delle dimensioni (questo andava già bene)
  dimensioni: z.array(
    DimensioneSchema.omit({ biciclettaId: true })
  ),
})

/**
 * -------------------------
 * INPUT SCHEMA (Per la creazione/modifica)
 * -------------------------
 */
export const BiciclettaInputSchema = z.object({
  modelloId: z.number().openapi({ example: 1 }),
  
  // Ora passi un array di ID per connettere le tipologie (es: [1] o [1, 2])
  tipologieIds: z.array(z.number()).openapi({ example: [1, 2] }),
  
  quantitaElettrico: z.number().default(0).openapi({ example: 5 }),
  quantitaMuscolare: z.number().default(0).openapi({ example: 3 }),
})

export const CreateBiciclettaSchema = BiciclettaInputSchema
export const UpdateBiciclettaSchema = BiciclettaInputSchema.partial() // partial permette modifiche parziali in update

/**
 * -------------------------
 * TYPES EXPORTS
 * -------------------------
 */
export type Bicicletta = z.infer<typeof BiciclettaSchema>
export type CreateBicicletta = z.infer<typeof CreateBiciclettaSchema>
export type UpdateBicicletta = z.infer<typeof UpdateBiciclettaSchema>