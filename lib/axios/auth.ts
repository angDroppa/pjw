import { AuthResponse } from '@/app/entities/auth.entities'
import api from './index'
import { Login, Register } from '@/lib/schemas/auth.schema'


export const authApi = {
  login: async (data: Login): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>('/auth/login', data)
    return response.data
  },

  register: async (data: Register): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>('/auth/register', data)
    return response.data
  },

  logout: async (refreshToken: string): Promise<void> => {
    await api.post('/auth/logout', { refreshToken })
  },
}

