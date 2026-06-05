import { Accessorio, CreateAccessorio, UpdateAccessorio } from '../zodSchemas/accessorio'
import { Assicurazione, CreateAssicurazione, UpdateAssicurazione } from '../zodSchemas/assicurazione'
import { BiciclettaCatalog, CreateBicicletta, CreateSpecifiche, UpdateSpecifiche } from '../zodSchemas/bicicletta'
import { BiciclettaLocationWithDetails, CreateBiciclettaLocation, UpdateBiciclettaLocation } from '../zodSchemas/biciclettaLocation'
import { CreateLocation, UpdateLocation, Location } from '../zodSchemas/location'
import { Prenotazione, StatoPrenotazione, UpdateStato } from '../zodSchemas/prenotazione'
import api from './index'

const BACKOFFICE = '/backoffice'

export interface ConfigResponse {
  negozi:        Location[]
  accessori:     Accessorio[]
  assicurazioni: Assicurazione[]
}

export interface CatalogoResponse {
  biciclette: BiciclettaCatalog[]
  negozi:     { id: number; nome: string }[]
}

interface StatisticheResponse {
  totalBookings:   number
  totalRevenue:    number
  shopPerformance: { name: string; revenue: number }[]
  mostUsedBikes:   { model: string; rentals: number }[]
  periodoFiltrato: { da: string; a: string } | null
}

interface PrenotazioniFiltri {
  utente?:     string
  data?:       string
  locationId?: number
}

interface StatisticheFiltri {
  da?: string
  a?:  string
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
    if (filtri?.a)  params.set('a',  filtri.a)
    const res = await api.get<StatisticheResponse>(`${BACKOFFICE}?${params}`)
    return res.data
  },

  // ─── Prenotazioni ────────────────────────────────────────────────────────────
  getPrenotazioni: async (filtri?: PrenotazioniFiltri): Promise<Prenotazione[]> => {
    const params = new URLSearchParams({ action: 'prenotazioni' })
    if (filtri?.utente)     params.set('utente',     filtri.utente)
    if (filtri?.data)       params.set('data',       filtri.data)
    if (filtri?.locationId) params.set('locationId', String(filtri.locationId))
    const res = await api.get<Prenotazione[]>(`${BACKOFFICE}?${params}`)
    return res.data
  },

  updateStatoPrenotazione: async (
    prenotazioneId: number,
    stato: StatoPrenotazione,
    note?: string,
    extra?: { noteRiconsegna?: string; danni?: string }
  ): Promise<Prenotazione> => {
    const payload: UpdateStato = { stato, ...(note ? { note } : {}), ...extra }
    const res = await api.post<Prenotazione>(BACKOFFICE, {
      action: 'update_stato_prenotazione',
      prenotazioneId,
      ...payload,
    })
    return res.data
  },

  // ─── Location ────────────────────────────────────────────────────────────────
  createLocation: async (data: CreateLocation): Promise<Location> => {
    const res = await api.post<Location>(BACKOFFICE, {
      action: 'create_location',
      ...data,
    })
    return res.data
  },

  updateLocation: async (locationId: number, data: UpdateLocation): Promise<Location> => {
    const res = await api.post<Location>(BACKOFFICE, {
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
  createAccessorio: async (data: CreateAccessorio): Promise<Accessorio> => {
    const res = await api.post<Accessorio>(BACKOFFICE, {
      action: 'create_accessorio',
      ...data,
    })
    return res.data
  },

  updateAccessorio: async (accessorioId: number, data: UpdateAccessorio): Promise<Accessorio> => {
    const res = await api.post<Accessorio>(BACKOFFICE, {
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
  createAssicurazione: async (data: CreateAssicurazione): Promise<Assicurazione> => {
    const res = await api.post<Assicurazione>(BACKOFFICE, {
      action: 'create_assicurazione',
      ...data,
    })
    return res.data
  },

  updateAssicurazione: async (assicurazioneId: number, data: UpdateAssicurazione): Promise<Assicurazione> => {
    const res = await api.post<Assicurazione>(BACKOFFICE, {
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
  createBicicletta: async (data: CreateBicicletta): Promise<BiciclettaCatalog> => {
    const res = await api.post<BiciclettaCatalog>(BACKOFFICE, {
      action: 'create_bicicletta',
      ...data,
    })
    return res.data
  },

  updateSpecifica: async (specificaId: number, data: UpdateSpecifiche): Promise<void> => {
  await api.post(BACKOFFICE, { action: 'update_specifica', specificaId, ...data })
},

  createSpecifica: async (data: CreateSpecifiche): Promise<void> => {
    await api.post(BACKOFFICE, { action: 'create_specifica', ...data })
  },

  deleteBicicletta: async (biciclettaId: number): Promise<void> => {
    await api.post(BACKOFFICE, { action: 'delete_bicicletta', biciclettaId })
  },

  deleteSpecifica: async (specificaId: number): Promise<void> => {
    await api.post(BACKOFFICE, { action: 'delete_specifica', specificaId })
  },

  // ─── Stock ───────────────────────────────────────────────────────────────────
  aggiungiiBiciNegozio: async (data: CreateBiciclettaLocation): Promise<BiciclettaLocationWithDetails> => {
    const res = await api.post<BiciclettaLocationWithDetails>(BACKOFFICE, {
      action: 'aggiungi_bici_negozio',
      ...data,
    })
    return res.data
  },

  updateStock: async (
    biciclettaLocationId: number,
    data: UpdateBiciclettaLocation
  ): Promise<BiciclettaLocationWithDetails> => {
    const res = await api.post<BiciclettaLocationWithDetails>(BACKOFFICE, {
      action: 'update_stock',
      biciclettaLocationId,
      ...data,
    })
    return res.data
  },
}
