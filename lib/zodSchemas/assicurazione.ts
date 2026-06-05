import { z } from 'zod'
import { decimalToNumber } from './util'

export const AssicurazioneSchema = z.object({
  id: z.number(),
  tipo: z.string(),
  dettagli: z.string(),
  prezzo: decimalToNumber,
})

export const CreateAssicurazioneSchema = AssicurazioneSchema.omit({ id: true }).extend({
  prezzo: z.number(),
})
export const UpdateAssicurazioneSchema = CreateAssicurazioneSchema.partial()

export type Assicurazione = z.infer<typeof AssicurazioneSchema>
export type CreateAssicurazione = z.infer<typeof CreateAssicurazioneSchema>
export type UpdateAssicurazione = z.infer<typeof UpdateAssicurazioneSchema>