import { AccessorioResponse, CreateAccessorio, UpdateAccessorio } from '../validators/accessorio'
import { AssicurazioneResponse, CreateAssicurazione, UpdateAssicurazione } from '../validators/assicurazione'
import { BiciclettaResponse, CreateBicicletta, CreateSpecifiche, UpdateSpecifiche } from '../validators/bicicletta'
import { BiciclettaLocationResponse, CreateBiciclettaLocation, UpdateBiciclettaLocation } from '../validators/biciclettaLocation'
import { CreateLocation, UpdateLocation, LocationResponse } from '../validators/location'
import { PrenotazioneResponse, StatoPrenotazioneSchema, UpdatePrenotazione } from '../validators/prenotazione'
import api from './index'

const BACKOFFICE = '/backoffice'

export interface ConfigResponse {
  negozi: LocationResponse[]
  accessori: AccessorioResponse[]
  assicurazioni: AssicurazioneResponse[]
}

export interface CatalogoResponse {
  biciclette: BiciclettaResponse[]
  negozi: { id: number; nome: string }[]
}

interface StatisticheResponse {
  totalBookings: number
  totalRevenue: number
  shopPerformance: { name: string; revenue: number }[]
  mostUsedBikes: { model: string; rentals: number }[]
  periodoFiltrato: { da: string; a: string } | null
}

interface PrenotazioniFiltri {
  utente?: string
  data?: string
  locationId?: number
}

interface StatisticheFiltri {
  da?: string
  a?: string
}

export const backofficeApi = {

  // ─── Config ─────────────────────────────────────────────────────────────────
  getConfig: async (): Promise<ConfigResponse> => {
    const res = await api.get<ConfigResponse>(`${BACKOFFICE}?action=config`)
    return res.data
  },

  getCatalogo: async (): Promise<CatalogoResponse> => {
    const res = await api.get<CatalogoResponse>(`${BACKOFFICE}?action=catalogo`)
    return res.data
  },

  getStatistiche: async (filtri?: StatisticheFiltri): Promise<StatisticheResponse> => {
    const params = new URLSearchParams({ action: 'statistiche' })
    if (filtri?.da) params.set('da', filtri.da)
    if (filtri?.a) params.set('a', filtri.a)
    const res = await api.get<StatisticheResponse>(`${BACKOFFICE}?${params}`)
    return res.data
  },

  // ─── Prenotazioni ────────────────────────────────────────────────────────────
  getPrenotazioni: async (filtri?: PrenotazioniFiltri): Promise<PrenotazioneResponse[]> => {
    const params = new URLSearchParams({ action: 'prenotazioni' })
    if (filtri?.utente) params.set('utente', filtri.utente)
    if (filtri?.data) params.set('data', filtri.data)
    if (filtri?.locationId) params.set('locationId', String(filtri.locationId))
    const res = await api.get<PrenotazioneResponse[]>(`${BACKOFFICE}?${params}`)
    return res.data
  },

  updateStatoPrenotazione: async (
    prenotazioneId: number,
    data: UpdatePrenotazione
  ): Promise<PrenotazioneResponse> => {
    const res = await api.post<PrenotazioneResponse>(BACKOFFICE, {
      action: 'update_stato_prenotazione',
      prenotazioneId,
      ...data,
    })
    return res.data
  },

  // ─── Location ────────────────────────────────────────────────────────────────
  createLocation: async (data: CreateLocation): Promise<LocationResponse> => {
    const res = await api.post<LocationResponse>(BACKOFFICE, {
      action: 'create_location',
      ...data,
    })
    return res.data
  },

  updateLocation: async (locationId: number, data: UpdateLocation): Promise<LocationResponse> => {
    const res = await api.post<LocationResponse>(BACKOFFICE, {
      action: 'update_location',
      locationId,
      ...data,
    })
    return res.data
  },

  deleteLocation: async (locationId: number): Promise<void> => {
    await api.post(BACKOFFICE, { action: 'delete_location', locationId })
  },

  // ─── Accessori ───────────────────────────────────────────────────────────────
  createAccessorio: async (data: CreateAccessorio): Promise<AccessorioResponse> => {
    const res = await api.post<AccessorioResponse>(BACKOFFICE, {
      action: 'create_accessorio',
      ...data,
    })
    return res.data
  },

  updateAccessorio: async (accessorioId: number, data: UpdateAccessorio): Promise<AccessorioResponse> => {
    const res = await api.post<AccessorioResponse>(BACKOFFICE, {
      action: 'update_accessorio',
      accessorioId,
      ...data,
    })
    return res.data
  },

  deleteAccessorio: async (accessorioId: number): Promise<void> => {
    await api.post(BACKOFFICE, { action: 'delete_accessorio', accessorioId })
  },

  // ─── Assicurazioni ───────────────────────────────────────────────────────────
  createAssicurazione: async (data: CreateAssicurazione): Promise<AssicurazioneResponse> => {
    const res = await api.post<AssicurazioneResponse>(BACKOFFICE, {
      action: 'create_assicurazione',
      ...data,
    })
    return res.data
  },

  updateAssicurazione: async (assicurazioneId: number, data: UpdateAssicurazione): Promise<AssicurazioneResponse> => {
    const res = await api.post<AssicurazioneResponse>(BACKOFFICE, {
      action: 'update_assicurazione',
      assicurazioneId,
      ...data,
    })
    return res.data
  },

  deleteAssicurazione: async (assicurazioneId: number): Promise<void> => {
    await api.post(BACKOFFICE, { action: 'delete_assicurazione', assicurazioneId })
  },

  // ─── Biciclette ──────────────────────────────────────────────────────────────
  createBicicletta: async (data: CreateBicicletta): Promise<BiciclettaResponse> => {
    const res = await api.post<BiciclettaResponse>(BACKOFFICE, {
      action: 'create_bicicletta',
      ...data,
    })
    return res.data
  },

  createSpecifica: async (data: CreateSpecifiche): Promise<void> => {
    await api.post(BACKOFFICE, { action: 'create_specifica', ...data })
  },

  updateSpecifica: async (specificaId: number, data: UpdateSpecifiche): Promise<void> => {
    await api.post(BACKOFFICE, { action: 'update_specifica', specificaId, ...data })
  },

  deleteBicicletta: async (biciclettaId: number): Promise<void> => {
    await api.post(BACKOFFICE, { action: 'delete_bicicletta', biciclettaId })
  },

  deleteSpecifica: async (specificaId: number): Promise<void> => {
    await api.post(BACKOFFICE, { action: 'delete_specifica', specificaId })
  },

  // ─── Stock ───────────────────────────────────────────────────────────────────
  aggiungiBiciNegozio: async (data: CreateBiciclettaLocation): Promise<BiciclettaLocationResponse> => {
    const res = await api.post<BiciclettaLocationResponse>(BACKOFFICE, {
      action: 'aggiungi_bici_negozio',
      ...data,
    })
    return res.data
  },

  updateStock: async (
    biciclettaLocationId: number,
    data: UpdateBiciclettaLocation
  ): Promise<BiciclettaLocationResponse> => {
    const res = await api.post<BiciclettaLocationResponse>(BACKOFFICE, {
      action: 'update_stock',
      biciclettaLocationId,
      ...data,
    })
    return res.data
  },

  getStock: async (): Promise<BiciclettaLocationResponse[]> => {
    const res = await api.get<BiciclettaLocationResponse[]>(`${BACKOFFICE}?action=stock`)
    return res.data
  },
  
  sendReminders: async (): Promise<{ inviati: number }> => {
    const res = await api.post<{ inviati: number }>('/backoffice', { action: 'send_reminders' })
    return res.data
  }
}