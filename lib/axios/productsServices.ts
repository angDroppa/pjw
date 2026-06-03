// lib/axios/productsServices.ts
import api from './index'
import prisma from '@/lib/prisma'
import { Bicicletta } from '../schemas/bicicletta.schema'

export const productsApi = {
  getProducts: async (): Promise<Bicicletta[]> => {
    // Controlliamo se siamo sul server Node.js
    if (typeof window === 'undefined') {
      return await prisma.bicicletta.findMany({
        include: {
          modello: true,      // Prende il nome del modello
          tipologia: true,    // Prende il nome della tipologia (es. Elettrica)
          dimensione: true,   // Prende l'array delle taglie disponibili
        },
        orderBy: {
          id: 'desc',         // Opzionale: mostra le ultime bici inserite per prime
        }
      }) as unknown as Bicicletta[] 
      // Nota: l'as unknown as Bicicletta[] serve se il tuo tipo "Bicicletta" nello schema 
      // si aspetta già che queste relazioni siano incluse.
    }
    
    // Se invece siamo sul client, interroga l'API Route (che abbiamo sistemato prima)
    const response = await api.get<Bicicletta[]>('/products')
    return response.data
  }
}