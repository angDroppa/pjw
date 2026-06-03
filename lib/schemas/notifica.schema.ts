import { z } from 'zod'
import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi'

extendZodWithOpenApi(z)

export const NotificaSchema = z.object({
  id: z.number().openapi({ example: 1 }),
  messaggio: z.string().openapi({ example: 'La tua prenotazione è confermata' }),
  utenteId: z.number().openapi({ example: 1 }),
})

export const CreateNotificaSchema = NotificaSchema.omit({ id: true })

export type Notifica = z.infer<typeof NotificaSchema>
export type CreateNotifica = z.infer<typeof CreateNotificaSchema>