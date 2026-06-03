import { z } from 'zod'
import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi'
import { ModelloSchema } from './modello.schema'
import { TipologiaSchema } from './tipologia.schema'

extendZodWithOpenApi(z)

export const BiciclettaSchema = z.object({
  id: z.number().openapi({ example: 1 }),
  dimensione: z.string().openapi({ example: 'M' }),
  modello: ModelloSchema,
  tipologia: TipologiaSchema
})

export const BiciclettaInputSchema = z.object({
  dimensione: z.string().openapi({ example: 'M' }),
  modelloId: z.number().openapi({ example: 1 }),
  tipologiaId: z.number().openapi({ example: 1 }),
})


export const CreateBiciclettaSchema = BiciclettaInputSchema;
export const UpdateBiciclettaSchema = BiciclettaInputSchema

export type Bicicletta = z.infer<typeof BiciclettaSchema>
export type CreateBicicletta = z.infer<typeof CreateBiciclettaSchema>
export type UpdateBicicletta = z.infer<typeof UpdateBiciclettaSchema>