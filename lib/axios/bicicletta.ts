import api from './index'
import { BiciclettaCatalog } from '../zodSchemas/bicicletta'
import { BiciclettaLocationWithDetails } from '../zodSchemas/biciclettaLocation'

interface DisponibilitaResult extends BiciclettaLocationWithDetails {
  istanzeTotali: number
  istanzeDisponibili: number
}

export const bicicletteApi = {
  getAll: async (): Promise<BiciclettaCatalog[]> => {
    const response = await api.get<BiciclettaCatalog[]>('/bicicletta')
    return response.data
  },

  getLocations: async (id: number): Promise<BiciclettaLocationWithDetails[]> => {
    const response = await api.get<BiciclettaLocationWithDetails[]>(`/bicicletta/${id}/locations`)
    return response.data
  },

  getDisponibilita: async (params: {
    dataRitiro: string
    oraRitiro: string
    dataConsegna: string
    oraConsegna: string
    biciclettaId?: number
    locationId?: number
  }): Promise<DisponibilitaResult[]> => {
    const response = await api.get<DisponibilitaResult[]>('/disponibilita', { params })
    return response.data
  },
}

export type { DisponibilitaResult }