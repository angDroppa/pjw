import { z } from 'zod'
import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi'

extendZodWithOpenApi(z)

export const TipologiaSchema = z.object({
  id: z.number().openapi({ example: 1 }),
  nome: z.string().openapi({ example: 'Mountain Bike' }),
})

export const CreateTipologiaSchema = TipologiaSchema.omit({ id: true })

export type Tipologia = z.infer<typeof TipologiaSchema>
export type CreateTipologia = z.infer<typeof CreateTipologiaSchema>