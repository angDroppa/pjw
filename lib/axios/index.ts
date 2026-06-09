import axios from 'axios'
import toast from 'react-hot-toast'
import { useLoadingStore } from '../store/loading.store'
import { createElement } from 'react'

//creazione client axios riutilizzato nella altre pagine
//date informazioni base 
//contenuto degli headers e tipo, e impostato invio di credentials sempre
const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
})

//interceptor su tette le request per far partire il loading ed evitare doppi click indesiderati da utente
api.interceptors.request.use((config) => {
  useLoadingStore.getState().start()
  return config
})
//interceptor sulle responses
api.interceptors.response.use(
  (res) => {
    //blocca il loader in caso di successo e restituisce il contenuto della response
    useLoadingStore.getState().stop()
    return res
  },
  (error) => {
    //blocca il loader e propaga errore
    useLoadingStore.getState().stop()
    //estrapoa status e url errore
    const status = error.response?.status
    const url = error.config?.url

    //questo solo in caso di logout
    if (status === 401 && url !== '/auth/login') {
      //qui si sceglie di non gestire l'errore perchè local href distrugge tutto il js in modo da evitare errori uncaught in promise. 
      //utile per centralizzare evitando try catch in ogni request con possibile fallimento legato a token
      // causa una navigazione hard che distrugge completamente la pagina — React smonta tutto, il browser libera tutta la memoria. 
      // La promise orfana vive pochissimo.

      if (error.config?.headers?.['x-silent-401']) {
        return Promise.reject(error)
      }
      window.location.href = `/login?from=${window.location.pathname}`
      return new Promise(() => { }) // promise che non si risolve mai, pagina cambia prima
    }

    //qui in caso di errore si seleziona il messaggio di errore preimpostato da mostrare all'utente tramite il toaster
    const message =
      typeof error.response?.data?.error === "string"
        ? error.response.data.error
        : undefined

    // toast.error(message ?? getErrorMessage(status))
    toast.custom(
      createElement("div", { className: "bg-red-600 text-white px-4 py-3 text-sm font-medium rounded-lg" }, message ?? getErrorMessage(status))
    )

    return Promise.reject(error)
  }
)

const getErrorMessage = (status?: number): string => {
  switch (status) {
    case 400: return 'Dati non validi.'
    case 401: return 'Credenziali non valide.'
    case 403: return 'Accesso negato.'
    case 404: return 'Risorsa non trovata.'
    case 409: return 'Risorsa già esistente.'
    case 500: return 'Errore del server. Riprova più tardi.'
    default: return 'Qualcosa è andato storto.'
  }
}

export default api

// window.location.href → distrugge tutto il contesto della pagina, il browser libera tutta la memoria inclusa la promise pendente —
// è una pulizia forzata dall't esterno

// catch → la promise finisce il suo ciclo naturale resolved/rejected → catturata → nessun riferimento → GC la pulisce —
// è una pulizia organica dall'interno