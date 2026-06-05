import { z } from 'zod'
import { decimalToNumber } from './util'

export const BiciclettaLocationSchema = z.object({
  id: z.number(),
  locationId: z.number(),
  biciclettaSpecificId: z.number(),
  numberE: z.number(),
  numberM: z.number(),
  location: z.object({
    id: z.number(),
    nome: z.string(),
    indirizzo: z.string(),
  }),
  biciclettaSpecific: z.object({
    id: z.number(),
    size: z.string(),
    price: decimalToNumber,
    biciclettaId: z.number(),
  }),
})

export const CreateBiciclettaLocationSchema = z.object({
  locationId: z.number(),
  biciclettaSpecificId: z.number(),
  numberE: z.number().int().min(0).default(0),
  numberM: z.number().int().min(0).default(0),
})

export const UpdateBiciclettaLocationSchema = z.object({
  numberE: z.number().int().min(0),
  numberM: z.number().int().min(0),
})

export type BiciclettaLocationWithDetails = z.infer<typeof BiciclettaLocationSchema>
export type CreateBiciclettaLocation = z.infer<typeof CreateBiciclettaLocationSchema>
export type UpdateBiciclettaLocation = z.infer<typeof UpdateBiciclettaLocationSchema>