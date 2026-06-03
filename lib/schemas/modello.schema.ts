import { z } from 'zod'
import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi'

extendZodWithOpenApi(z)

export const ModelloSchema = z.object({
  id: z.number().openapi({ example: 1 }),
  nome: z.string().openapi({ example: 'Trek FX3' }),
})

export const CreateModelloSchema = ModelloSchema.omit({ id: true })

export type Modello = z.infer<typeof ModelloSchema>
export type CreateModello = z.infer<typeof CreateModelloSchema>