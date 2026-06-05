import { z } from 'zod'

export const LocationSchema = z.object({
  id: z.number(),
  nome: z.string(),
  indirizzo: z.string(),
})

export const CreateLocationSchema = LocationSchema.omit({ id: true }).extend({
  nome: z.string().min(1),
  indirizzo: z.string().min(1),
})
export const UpdateLocationSchema = CreateLocationSchema.partial()

export type Location = z.infer<typeof LocationSchema>
export type CreateLocation = z.infer<typeof CreateLocationSchema>
export type UpdateLocation = z.infer<typeof UpdateLocationSchema>