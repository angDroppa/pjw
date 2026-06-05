import { AuthResponse } from '@/app/entities/auth.entities'
import api from './index'

export interface RegisterPayload {
  firstName: string
  lastName: string
  email: string
  password: string
}

export const authApi = {
  login: async (data: { email: string; password: string }): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>('/auth/login', data)
    return response.data
  },

  register: async (data: RegisterPayload): Promise<{ message: string; verificationToken?: string }> => {
    const response = await api.post('/auth/register', data)
    return response.data
  },

  logout: async (refreshToken: string): Promise<void> => {
    await api.post('/auth/logout', { refreshToken })
  },
}
