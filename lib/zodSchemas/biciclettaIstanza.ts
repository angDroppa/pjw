import { z } from 'zod'

export const BiciclettaIstanzaSchema = z.object({
  id: z.number(),
  codice: z.string(),
  specificheBiciclettaId: z.number(),
  locationId: z.number(),
  occupata: z.boolean(),
  occupataDa: z.string().nullable(),
  occupataA: z.string().nullable(),
  biciclettaLocationId: z.number().nullable(),
})

export const CreateBiciclettaIstanzaSchema = z.object({
  codice: z.string().min(1),
  specificheBiciclettaId: z.number(),
  locationId: z.number(),
  biciclettaLocationId: z.number().optional(),
})

export const DisponibilitaQuerySchema = z.object({
  dataRitiro: z.coerce.date(),
  oraRitiro: z.string(),
  dataConsegna: z.coerce.date(),
  oraConsegna: z.string(),
})

export type BiciclettaIstanza = z.infer<typeof BiciclettaIstanzaSchema>
export type CreateBiciclettaIstanza = z.infer<typeof CreateBiciclettaIstanzaSchema>
export type DisponibilitaQuery = z.infer<typeof DisponibilitaQuerySchema>
