// lib/axios/productsServices.ts
import api from './index'
import prisma from '@/lib/prisma'
import { Bicicletta } from '../schemas/bicicletta.schema'

export const productsApi = {
  getProducts: async (): Promise<Bicicletta[]> => {
    // Controlliamo se siamo sul server Node.js
    if (typeof window === 'undefined') {
      console.log("[Server] Fetching direttamente dal Database con Prisma...")
      return await prisma.bicicletta.findMany({})
    }

    // Se siamo nel browser (Client), usiamo Axios verso la Route API
    console.log("[Client] Fetching tramite Axios...")
    const response = await api.get<Bicicletta[]>('/products')
    return response.data
  }
}