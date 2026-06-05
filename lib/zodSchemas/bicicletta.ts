import { z } from 'zod'
import { decimalToNumber } from './util'

export const TipologiaBiciclettaSchema = z.enum(['CITY', 'MOUNTAIN', 'GRAVEL', 'ROAD'])
export const AlimentazioneSchema = z.enum(['MUSCOLARE', 'ELETTRICA'])

export const BiciclettaSchema = z.object({
  id: z.number(),
  nome: z.string(),
  tipologia: TipologiaBiciclettaSchema,
})

export const SpecificheBiciclettaSchema = z.object({
  id: z.number(),
  size: z.string(),
  alimentazione: AlimentazioneSchema,
  prezzoGiornata: decimalToNumber,
  prezzoMezzaGiornata: decimalToNumber,
  altezzaMin: z.number().nullable(),
  altezzaMax: z.number().nullable(),
  biciclettaId: z.number(),
  bicicletta: BiciclettaSchema.optional(),
})

export const BiciclettaCatalogSchema = BiciclettaSchema.extend({
  specifics: z.array(z.object({
    id: z.number(),
    size: z.string(),
    alimentazione: AlimentazioneSchema,
    prezzoGiornata: decimalToNumber,
    prezzoMezzaGiornata: decimalToNumber,
    altezzaMin: z.number().nullable(),
    altezzaMax: z.number().nullable(),
  })),
})

export const CreateBiciclettaSchema = z.object({
  nome: z.string().min(1),
  tipologia: TipologiaBiciclettaSchema,
})

export const CreateSpecificheSchema = z.object({
  biciclettaId: z.number(),
  size: z.string().min(1),
  alimentazione: AlimentazioneSchema,
  prezzoGiornata: z.number().positive(),
  prezzoMezzaGiornata: z.number().positive(),
  altezzaMin: z.number().int().optional(),
  altezzaMax: z.number().int().optional(),
})

export const UpdateSpecificheSchema = CreateSpecificheSchema.omit({ biciclettaId: true }).partial()

export type TipologiaBicicletta = z.infer<typeof TipologiaBiciclettaSchema>
export type Alimentazione = z.infer<typeof AlimentazioneSchema>
export type Bicicletta = z.infer<typeof BiciclettaSchema>
export type BiciclettaCatalog = z.infer<typeof BiciclettaCatalogSchema>
export type SpecificheBicicletta = z.infer<typeof SpecificheBiciclettaSchema>
export type CreateBicicletta = z.infer<typeof CreateBiciclettaSchema>
export type CreateSpecifiche = z.infer<typeof CreateSpecificheSchema>
export type UpdateSpecifiche = z.infer<typeof UpdateSpecificheSchema>
