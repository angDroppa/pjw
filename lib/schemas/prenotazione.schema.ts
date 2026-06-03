import { z } from 'zod'
import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi'
import { LocationSchema } from './location.schema'
import { BiciclettaSchema } from './bicicletta.schema'

extendZodWithOpenApi(z)

export const PrenotazioneSchema = z.object({
  id: z.number().openapi({ example: 1 }),
  dataRitiro: z.coerce.date().openapi({ example: '2025-06-01T09:00:00Z' }),
  dataOreConsegna: z.coerce.date().openapi({ example: '2025-06-07T18:00:00Z' }),
  dataPickUp: z.coerce.date().openapi({ example: '2025-06-01T08:30:00Z' }),
  utenteId: z.number().openapi({ example: 1 }),
  biciclettaId: z.number().openapi({ example: 1 }),
  locationId: z.number().openapi({ example: 1 }),
})

export const PrenotazioneDetailSchema = PrenotazioneSchema.extend({
  bicicletta: BiciclettaSchema,
  location: LocationSchema,
})

export const CreatePrenotazioneSchema = PrenotazioneSchema.omit({ id: true, utenteId: true })

export const UpdatePrenotazioneSchema = CreatePrenotazioneSchema.partial()

export type Prenotazione = z.infer<typeof PrenotazioneSchema>
export type PrenotazioneDetail = z.infer<typeof PrenotazioneDetailSchema>
export type CreatePrenotazione = z.infer<typeof CreatePrenotazioneSchema>
export type UpdatePrenotazione = z.infer<typeof UpdatePrenotazioneSchema>