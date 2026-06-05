import { z } from 'zod'
import { decimalToNumber } from './util'

export const BiciclettaSchema = z.object({
  id: z.number(),
  type: z.string(),
})

export const SpecificheBiciclettaSchema = z.object({
  id: z.number(),
  size: z.string(),
  price: decimalToNumber,
  biciclettaId: z.number(),
  bicicletta: BiciclettaSchema.optional(),
})

export const BiciclettaCatalogSchema = BiciclettaSchema.extend({
  specifics: z.array(z.object({
    id: z.number(),
    size: z.string(),
    price: decimalToNumber,
  })),
})

export const CreateBiciclettaSchema = z.object({
  type: z.string().min(1),
})

export const CreateSpecificheSchema = z.object({
  biciclettaId: z.number(),
  size: z.string().min(1),
  price: z.number().positive(),
})

export const UpdateSpecificheSchema = CreateSpecificheSchema.omit({ biciclettaId: true }).partial()

export type Bicicletta = z.infer<typeof BiciclettaSchema>
export type BiciclettaCatalog = z.infer<typeof BiciclettaCatalogSchema>
export type SpecificheBicicletta = z.infer<typeof SpecificheBiciclettaSchema>
export type CreateBicicletta = z.infer<typeof CreateBiciclettaSchema>
export type CreateSpecifiche = z.infer<typeof CreateSpecificheSchema>
export type UpdateSpecifiche = z.infer<typeof UpdateSpecificheSchema>