import { z } from 'zod'
import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi'

extendZodWithOpenApi(z)

export const AssicurazioneSchema = z.object({
  id: z.number().openapi({ example: 1 }),
  tipo: z.string().openapi({ example: 'Base' }),
  dettagli: z.string().openapi({ example: 'Copertura furto e danni' }),
})

export const CreateAssicurazioneSchema = AssicurazioneSchema.omit({ id: true })

export type Assicurazione = z.infer<typeof AssicurazioneSchema>
export type CreateAssicurazione = z.infer<typeof CreateAssicurazioneSchema>