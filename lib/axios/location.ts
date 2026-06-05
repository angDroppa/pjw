import { Location } from '../zodSchemas/location'
import api from './index'

export const locationsApi = {
    getAll: async (): Promise<Location[]> => {
        const response = await api.get<Location[]>('/location')
        return response.data
    }
}