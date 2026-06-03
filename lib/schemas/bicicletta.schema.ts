import { z } from 'zod'
import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi'
import { ModelloSchema } from './modello.schema'
import { TipologiaSchema } from './tipologia.schema'
import { AccessorioSchema } from './accessorio.schema'
import { AssicurazioneSchema } from './assicurazione.schema'

extendZodWithOpenApi(z)

export const BiciclettaSchema = z.object({
  id: z.number().openapi({ example: 1 }),
  dimensione: z.string().openapi({ example: 'M' }),
  modelloId: z.number().openapi({ example: 1 }),
  tipologiaId: z.number().openapi({ example: 1 }),
  coperturaId: z.number().openapi({ example: 1 }),
})

export const BiciclettaDetailSchema = BiciclettaSchema.extend({
  modello: ModelloSchema,
  tipologia: TipologiaSchema,
  accessori: z.array(AccessorioSchema),
  copertura: AssicurazioneSchema,
})

export const CreateBiciclettaSchema = BiciclettaSchema.omit({ id: true }).extend({
  accessoriIds: z.array(z.number()).optional().openapi({ example: [1, 2] }),
})

export const UpdateBiciclettaSchema = CreateBiciclettaSchema.partial()

export type Bicicletta = z.infer<typeof BiciclettaSchema>
export type BiciclettaDetail = z.infer<typeof BiciclettaDetailSchema>
export type CreateBicicletta = z.infer<typeof CreateBiciclettaSchema>
export type UpdateBicicletta = z.infer<typeof UpdateBiciclettaSchema>