import api from './index'
import { BiciclettaCatalog } from '../zodSchemas/bicicletta'
import { BiciclettaLocationWithDetails } from '../zodSchemas/biciclettaLocation'

export const bicicletteApi = {
  getAll: async (): Promise<BiciclettaCatalog[]> => {
    const response = await api.get<BiciclettaCatalog[]>('/bicicletta')
    return response.data
  },

  getLocations: async (id: number): Promise<BiciclettaLocationWithDetails[]> => {
    const response = await api.get<BiciclettaLocationWithDetails[]>(`/bicicletta/${id}/locations`)
    return response.data
  },
}