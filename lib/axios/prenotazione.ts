
import api from '@/lib/axios'
import { PrenotazioneBatchInput, PrenotazioneInput, PrenotazioneResponse, UpdatePrenotazioneCliente } from '../validators/prenotazione'

export const createPrenotazione = async (data: PrenotazioneInput): Promise<void> => {
  await api.post("/prenotazione", data);
};

export const prenotazioneApi = {
  getPrenotazioni: async (): Promise<PrenotazioneResponse[]> => {
    const res = await api.get<PrenotazioneResponse[]>('/prenotazione')
    return res.data
  },

  createPrenotazione: async (data: PrenotazioneInput): Promise<void> => {
    await api.post('/prenotazione', data)
  },

  updatePrenotazione: async (id: number, data: UpdatePrenotazioneCliente): Promise<PrenotazioneResponse> => {
    const res = await api.patch<PrenotazioneResponse>(`/prenotazione/${id}`, data)
    return res.data
  },

  cancellaPrenotazione: async (id: number): Promise<void> => {
    await api.delete(`/prenotazione/${id}`)
  },

  batchCreatePrenotazioni: async (
    data: PrenotazioneBatchInput
  ): Promise<PrenotazioneResponse[]> => {
    const res = await api.post<{ prenotazioni: PrenotazioneResponse[] }>(
      '/prenotazione/batch',
      data
    )

    return res.data.prenotazioni
  },


}



