import { z } from 'zod'

export const RegisterSchema = z.object({
  firstName: z.string().min(1, 'Nome obbligatorio'),
  lastName: z.string().min(1, 'Cognome obbligatorio'),
  email: z.string().email('Email non valida'),
  password: z.string().min(8, 'Password minima 8 caratteri'),
})

export const LoginSchema = z.object({
  email: z.string().email('Email non valida'),
  password: z.string().min(1, 'Inserisci la password'),
})

export const LoginResponseSchema = z.object({
  accessToken: z.string(),
  refreshToken: z.string(),
  user: z.object({
    id: z.number(),
    firstName: z.string(),
    lastName: z.string(),
    email: z.string(),
    roleName: z.string(),
  }),
})

export const RegisterFormSchema = RegisterSchema.extend({
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Le password non coincidono.',
  path: ['confirmPassword'],
})

export type RegisterForm = z.infer<typeof RegisterFormSchema>
export type Register = z.infer<typeof RegisterSchema>
export type Login = z.infer<typeof LoginSchema>
