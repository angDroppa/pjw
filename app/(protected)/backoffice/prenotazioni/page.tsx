'use client'

import { useState, useEffect, useCallback } from 'react'
import { backofficeApi } from '@/lib/axios/backoffice'
import { Prenotazione, StatoPrenotazione } from '@/lib/zodSchemas/prenotazione'
import { Toast, Card, Btn, Field, Inp, Sel, Modal } from '../components/ui'

const statoLabel: Record<string, string> = {
  PENDING: 'In attesa',
  PICKED_UP: 'In corso',
  RETURNED: 'Completata',
  LATE: 'In ritardo',
}

const statColor: Record<string, string> = {
  PENDING: '#f59e0b',
  PICKED_UP: '#3b82f6',
  RETURNED: '#10b981',
  LATE: '#ef4444',
}

export default function PrenotazioniPage() {
  const [prenotazioni, setPrenotazioni] = useState<Prenotazione[]>([])
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState<{ msg: string; type: 'ok' | 'err' } | null>(null)
  const [filtroUtente, setFiltroUtente] = useState('')
  const [filtroData, setFiltroData] = useState('')
  const [filtroLocation, setFiltroLocation] = useState('')
  const [detail, setDetail] = useState<Prenotazione | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const data = await backofficeApi.getPrenotazioni({
        utente: filtroUtente || undefined,
        data: filtroData || undefined,
        locationId: filtroLocation ? parseInt(filtroLocation) : undefined,
      })
      setPrenotazioni(data)
    } catch { setToast({ msg: 'Errore caricamento', type: 'err' }) }
    finally { setLoading(false) }
  }, [filtroUtente, filtroData, filtroLocation])

  useEffect(() => { load() }, [load])

  const handleStato = async (id: number, stato: StatoPrenotazione) => {
    try {
      await backofficeApi.updateStatoPrenotazione(id, stato)
      setToast({ msg: `Stato aggiornato a "${statoLabel[stato]}"`, type: 'ok' })
      load()
    } catch { setToast({ msg: 'Errore aggiornamento', type: 'err' }) }
  }

  return (
    <>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

        {/* Filtri */}
        <Card>
          <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end', flexWrap: 'wrap' }}>
            <Field label="Utente">
              <Inp value={filtroUtente} onChange={setFiltroUtente} placeholder="Nome o cognome..." />
            </Field>
            <Field label="Data ritiro">
              <input type="date" value={filtroData} onChange={e => setFiltroData(e.target.value)}
                style={{ background: 'var(--input-bg)', border: '1px solid var(--border)', borderRadius: 8, padding: '8px 12px', color: 'var(--text-primary)', fontFamily: 'var(--font-body)', fontSize: 13 }} />
            </Field>
            <Btn onClick={load}>Cerca</Btn>
            <Btn variant="ghost" onClick={() => { setFiltroUtente(''); setFiltroData(''); setFiltroLocation('') }}>Reset</Btn>
          </div>
        </Card>

        {/* Tabella */}
        <Card>
          {loading ? (
            <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: 40 }}>Caricamento...</p>
          ) : prenotazioni.length === 0 ? (
            <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: 40 }}>Nessuna prenotazione trovata.</p>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, minWidth: 700 }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border)' }}>
                    {['ID', 'Utente', 'Bici', 'Location', 'Ritiro', 'Consegna', 'Stato', 'Totale', 'Azioni'].map(h => (
                      <th key={h} style={{ textAlign: 'left', padding: '8px 10px', color: 'var(--text-secondary)', fontWeight: 600, fontSize: 11, textTransform: 'uppercase' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {prenotazioni.map(p => (
                    <tr key={p.id} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: '8px 10px', fontWeight: 600, color: 'var(--text-primary)' }}>#{p.id}</td>
                      <td style={{ padding: '8px 10px' }}>{(p as any).utente?.firstName} {(p as any).utente?.lastName}</td>
                      <td style={{ padding: '8px 10px' }}>{(p.bicicletta as any)?.bicicletta?.nome ?? '—'}</td>
                      <td style={{ padding: '8px 10px' }}>{p.location.nome}</td>
                      <td style={{ padding: '8px 10px', whiteSpace: 'nowrap' }}>{new Date(p.dataRitiro).toLocaleDateString()} {p.oraRitiro}</td>
                      <td style={{ padding: '8px 10px', whiteSpace: 'nowrap' }}>{new Date(p.dataConsegna).toLocaleDateString()} {p.oraConsegna}</td>
                      <td style={{ padding: '8px 10px' }}>
                        <span style={{
                          display: 'inline-block', padding: '2px 10px', borderRadius: 99,
                          background: `${statColor[p.stato]}20`, color: statColor[p.stato],
                          fontSize: 11, fontWeight: 700,
                        }}>{statoLabel[p.stato] ?? p.stato}</span>
                      </td>
                      <td style={{ padding: '8px 10px', fontWeight: 600 }}>€{Number(p.totalePagato).toFixed(2)}</td>
                      <td style={{ padding: '8px 10px' }}>
                        <div style={{ display: 'flex', gap: 4 }}>
                          <Btn small onClick={() => setDetail(p)}>👁</Btn>
                          {p.stato === 'PENDING' && <Btn small onClick={() => handleStato(p.id, 'PICKED_UP')}>✅</Btn>}
                          {p.stato === 'PICKED_UP' && <Btn small onClick={() => handleStato(p.id, 'RETURNED')}>🔄</Btn>}
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

      {detail && (
        <Modal title={`Prenotazione #${detail.id}`} onClose={() => setDetail(null)} maxWidth={500}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, fontSize: 13 }}>
            <div><strong>Utente:</strong> {(detail as any).utente?.firstName} {(detail as any).utente?.lastName} ({(detail as any).utente?.email})</div>
            <div><strong>Bicicletta:</strong> {(detail.bicicletta as any)?.bicicletta?.nome ?? '—'} - {detail.bicicletta.size} - {detail.bicicletta.alimentazione === 'ELETTRICA' ? 'Elettrica' : 'Muscolare'}</div>
            <div><strong>Location:</strong> {detail.location.nome} - {detail.location.indirizzo}</div>
            <div><strong>Ritiro:</strong> {new Date(detail.dataRitiro).toLocaleDateString()} {detail.oraRitiro}</div>
            <div><strong>Consegna:</strong> {new Date(detail.dataConsegna).toLocaleDateString()} {detail.oraConsegna}</div>
            <div><strong>Assicurazione:</strong> {detail.copertura.tipo} (€{Number(detail.copertura.prezzo).toFixed(2)})</div>
            <div><strong>Accessori:</strong> {detail.accessori.length > 0 ? detail.accessori.map(a => a.nome).join(', ') : 'Nessuno'}</div>
            <div><strong>Stato:</strong> {statoLabel[detail.stato]}</div>
            <div><strong>Totale:</strong> €{Number(detail.totalePagato).toFixed(2)}</div>
            <div><strong>Note:</strong> {detail.note ?? '—'}</div>
            <div><strong>Danni:</strong> {detail.danni ?? '—'}</div>
            <div><strong>Note riconsegna:</strong> {detail.noteRiconsegna ?? '—'}</div>
          </div>
        </Modal>
      )}

      {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
    </>
  )
}
