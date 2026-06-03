import { z } from 'zod'
import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi'

extendZodWithOpenApi(z)

export const AccessorioSchema = z.object({
  id: z.number().openapi({ example: 1 }),
  nome: z.string().openapi({ example: 'Casco' }),
})

export const CreateAccessorioSchema = AccessorioSchema.omit({ id: true })

export type Accessorio = z.infer<typeof AccessorioSchema>
export type CreateAccessorio = z.infer<typeof CreateAccessorioSchema>