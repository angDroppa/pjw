import { AppLocation } from '../schemas/location.schema'
import api from './index'

export const locationsApi = {
    getAll: async (): Promise<AppLocation[]> => {
        const response = await api.get<AppLocation[]>('/location')
        return response.data
    }
}