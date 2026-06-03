import { z } from 'zod'
import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi'

extendZodWithOpenApi(z)

export const LocationSchema = z.object({
  id: z.number().openapi({ example: 1 }),
  nome: z.string().openapi({ example: 'Sede Centrale' }),
  indirizzo: z.string().openapi({ example: 'Via Roma 1, Milano' }),
})

export const CreateLocationSchema = LocationSchema.omit({ id: true })

export type Location = z.infer<typeof LocationSchema>
export type CreateLocation = z.infer<typeof CreateLocationSchema>