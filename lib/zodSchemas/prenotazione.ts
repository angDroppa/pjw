import { z } from 'zod'
import { SpecificheBiciclettaSchema } from './bicicletta'
import { LocationSchema } from './location'
import { AssicurazioneSchema } from './assicurazione'
import { AccessorioSchema } from './accessorio'
import { decimalToNumber } from './util'

export const StatoPrenotazioneSchema = z.enum([
  'PENDING',
  'PICKED_UP',
  'RETURNED',
  'LATE',
])

export const PrenotazioneSchema = z.object({
  id: z.number(),
  dataRitiro: z.coerce.date(),
  oraRitiro: z.string(),
  dataConsegna: z.coerce.date(),
  oraConsegna: z.string(),
  stato: StatoPrenotazioneSchema,
  note: z.string().nullable(),
  totalePagato: decimalToNumber,
  utenteId: z.number(),
  bicicletta: SpecificheBiciclettaSchema,
  location: LocationSchema,
  copertura: AssicurazioneSchema,
  accessori: z.array(AccessorioSchema),
})

export const CreatePrenotazioneSchema = z.object({
  dataRitiro: z.coerce.date(),
  oraRitiro: z.string(),
  dataConsegna: z.coerce.date(),
  oraConsegna: z.string(),
  biciclettaId: z.number(),
  locationId: z.number(),
  assicurazioneId: z.number(),
  accessoriIds: z.array(z.number()).default([]),
  note: z.string().optional(),
})

export const UpdateStatoSchema = z.object({
  stato: StatoPrenotazioneSchema,
  note: z.string().optional(),
})

export type StatoPrenotazione = z.infer<typeof StatoPrenotazioneSchema>
export type Prenotazione = z.infer<typeof PrenotazioneSchema>
export type CreatePrenotazione = z.infer<typeof CreatePrenotazioneSchema>
export type UpdateStato = z.infer<typeof UpdateStatoSchema>