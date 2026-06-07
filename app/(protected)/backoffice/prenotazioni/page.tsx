'use client'

import { useState, useEffect } from 'react'
import { backofficeApi } from '@/lib/axios/backoffice'
import { PrenotazioneResponse, StatoPrenotazioneSchema, UpdatePrenotazioneSchema } from '@/lib/validators/prenotazione'
import { Toast, Card, Btn, Field, Inp, Modal } from '../components/ui'

type StatoPrenotazione = PrenotazioneResponse['stato']

const statoLabel: Record<StatoPrenotazione, string> = {
  PENDING:   'In attesa',
  PICKED_UP: 'In corso',
  RETURNED:  'Completata',
  LATE:      'In ritardo',
}

const statColor: Record<StatoPrenotazione, string> = {
  PENDING:   '#f59e0b',
  PICKED_UP: '#3b82f6',
  RETURNED:  '#10b981',
  LATE:      '#ef4444',
}

const alimentazioneLabel: Record<PrenotazioneResponse['alimentazione'], string> = {
  MUSCOLARE: 'Muscolare',
  ELETTRICA: 'Elettrica',
}

export default function PrenotazioniPage() {
  const [prenotazioni, setPrenotazioni] = useState<PrenotazioneResponse[]>([])
  const [toast, setToast]   = useState<{ msg: string; type: 'ok' | 'err' } | null>(null)
  const [detail, setDetail] = useState<PrenotazioneResponse | null>(null)

  const [filtroUtente,   setFiltroUtente]   = useState('')
  const [filtroData,     setFiltroData]     = useState('')
  const [filtroLocation, setFiltroLocation] = useState('')

  useEffect(() => {
    let cancelled = false

    const fetchData = async () => {
      try {
        const data = await backofficeApi.getPrenotazioni({
          utente:     filtroUtente    || undefined,
          data:       filtroData      || undefined,
          locationId: filtroLocation  ? parseInt(filtroLocation) : undefined,
        })
        if (!cancelled) setPrenotazioni(data)
      } catch {
        if (!cancelled) setToast({ msg: 'Errore caricamento', type: 'err' })
      }
    }

    fetchData()
    return () => { cancelled = true }
  }, [filtroUtente, filtroData, filtroLocation])

  const handleStato = async (id: number, stato: StatoPrenotazione) => {
    try {
      const payload = UpdatePrenotazioneSchema.parse({ stato })
      await backofficeApi.updateStatoPrenotazione(id, payload)
      setPrenotazioni(prev =>
        prev.map(p => p.id === id ? { ...p, stato } : p)
      )
      setToast({ msg: `Stato aggiornato a "${statoLabel[stato]}"`, type: 'ok' })
    } catch {
      setToast({ msg: 'Errore aggiornamento', type: 'err' })
    }
  }

  return (
    <>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20, color: '#fff' }}>

        {/* FILTRI */}
        <Card>
          <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end', flexWrap: 'wrap' }}>
            <Field label="Utente">
              <Inp value={filtroUtente} onChange={setFiltroUtente} placeholder="Nome o cognome..." />
            </Field>

            <Field label="Data ritiro">
              <input
                type="date"
                value={filtroData}
                onChange={e => setFiltroData(e.target.value)}
                style={{
                  background:  'var(--input-bg)',
                  border:      '1px solid var(--border)',
                  borderRadius: 8,
                  padding:     '8px 12px',
                  color:       '#fff',
                  fontFamily:  'var(--font-body)',
                  fontSize:    13,
                  colorScheme: 'dark',
                }}
              />
            </Field>

            <Btn onClick={() => {}}>Cerca</Btn>

            <Btn variant="ghost" onClick={() => {
              setFiltroUtente('')
              setFiltroData('')
              setFiltroLocation('')
            }}>
              Reset
            </Btn>
          </div>
        </Card>

        {/* TABELLA */}
        <Card>
          {prenotazioni.length === 0 ? (
            <p style={{ color: '#fff', textAlign: 'center', padding: 40 }}>
              Nessuna prenotazione trovata.
            </p>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, minWidth: 700, color: '#fff' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border)' }}>
                    {['ID', 'Utente', 'Bici', 'Alimentazione', 'Location', 'Ritiro', 'Consegna', 'Stato', 'Totale', 'Azioni'].map(h => (
                      <th key={h} style={{
                        textAlign:     'left',
                        padding:       '8px 10px',
                        color:         '#fff',
                        fontWeight:    600,
                        fontSize:      11,
                        textTransform: 'uppercase',
                      }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>

                <tbody>
                  {prenotazioni.map(p => (
                    <tr key={p.id} style={{ borderBottom: '1px solid var(--border)', color: '#fff' }}>

                      <td style={{ padding: '8px 10px', fontWeight: 600 }}>#{p.id}</td>

                      <td style={{ padding: '8px 10px' }}>
                        {p.utente.firstName} {p.utente.lastName}
                      </td>

                      <td style={{ padding: '8px 10px' }}>
                        {p.bicicletta.size}
                      </td>

                      <td style={{ padding: '8px 10px' }}>
                        {alimentazioneLabel[p.alimentazione]}
                      </td>

                      <td style={{ padding: '8px 10px' }}>
                        {p.location.nome}
                      </td>

                      <td style={{ padding: '8px 10px', whiteSpace: 'nowrap' }}>
                        {new Date(p.dataRitiro).toLocaleDateString()} {p.oraRitiro}
                      </td>

                      <td style={{ padding: '8px 10px', whiteSpace: 'nowrap' }}>
                        {new Date(p.dataConsegna).toLocaleDateString()} {p.oraConsegna}
                      </td>

                      <td style={{ padding: '8px 10px' }}>
                        <span style={{
                          display:      'inline-block',
                          padding:      '2px 10px',
                          borderRadius: 99,
                          background:   `${statColor[p.stato]}20`,
                          color:        statColor[p.stato],
                          fontSize:     11,
                          fontWeight:   700,
                        }}>
                          {statoLabel[p.stato]}
                        </span>
                      </td>

                      <td style={{ padding: '8px 10px', fontWeight: 600 }}>
                        €{Number(p.totalePagato).toFixed(2)}
                      </td>

                      <td style={{ padding: '8px 10px' }}>
                        <div style={{ display: 'flex', gap: 4 }}>
                          <Btn small onClick={() => setDetail(p)}>👁</Btn>

                          {p.stato === 'PENDING' && (
                            <Btn small onClick={() => handleStato(p.id, 'PICKED_UP')}>✅</Btn>
                          )}

                          {p.stato === 'PICKED_UP' && (
                            <Btn small onClick={() => handleStato(p.id, 'RETURNED')}>🔄</Btn>
                          )}

                          {(p.stato === 'PICKED_UP' || p.stato === 'PENDING') && (
                            <Btn small variant="warning" onClick={() => handleStato(p.id, 'LATE')}>⚠️</Btn>
                          )}
                        </div>
                      </td>

                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>

      {/* MODAL DETTAGLIO */}
      {detail && (
        <Modal title={`Prenotazione #${detail.id}`} onClose={() => setDetail(null)} maxWidth={500}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, color: '#fff', fontSize: 13 }}>

            <div><strong>Utente:</strong> {detail.utente.firstName} {detail.utente.lastName} ({detail.utente.email})</div>

            <div><strong>Bicicletta:</strong> {detail.bicicletta.size}</div>

            <div><strong>Alimentazione:</strong> {alimentazioneLabel[detail.alimentazione]}</div>

            <div><strong>Location:</strong> {detail.location.nome} — {detail.location.indirizzo}</div>

            <div><strong>Ritiro:</strong> {new Date(detail.dataRitiro).toLocaleDateString()} {detail.oraRitiro}</div>

            <div><strong>Consegna:</strong> {new Date(detail.dataConsegna).toLocaleDateString()} {detail.oraConsegna}</div>

            <div><strong>Assicurazione:</strong> {detail.copertura.tipo}</div>

            <div>
              <strong>Accessori:</strong>{' '}
              {detail.accessori.length ? detail.accessori.map(a => a.nome).join(', ') : 'Nessuno'}
            </div>

            <div><strong>Stato:</strong> {statoLabel[detail.stato]}</div>

            {detail.noteRiconsegna && (
              <div><strong>Note riconsegna:</strong> {detail.noteRiconsegna}</div>
            )}

            {detail.danni && (
              <div><strong>Danni:</strong> {detail.danni}</div>
            )}

            <div><strong>Totale:</strong> €{Number(detail.totalePagato).toFixed(2)}</div>

          </div>
        </Modal>
      )}

      {toast && (
        <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />
      )}
    </>
  )
}