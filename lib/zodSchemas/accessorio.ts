import { z } from 'zod'

export const AccessorioSchema = z.object({
  id: z.number(),
  nome: z.string(),
  prezzo: z.number(),
})

export const CreateAccessorioSchema = AccessorioSchema.omit({ id: true })
export const UpdateAccessorioSchema = CreateAccessorioSchema.partial()

export type Accessorio = z.infer<typeof AccessorioSchema>
export type CreateAccessorio = z.infer<typeof CreateAccessorioSchema>
export type UpdateAccessorio = z.infer<typeof UpdateAccessorioSchema>