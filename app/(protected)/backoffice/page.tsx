'use client'

import api from '@/lib/axios';
import { useState, useEffect, useCallback } from 'react'

// ─── Types ────────────────────────────────────────────────────────────────────

type StatoPrenotazione = 'PENDING' | 'PICKED_UP' | 'RETURNED' | 'LATE' | 'DAMAGED' | 'CANCELLED'

interface Modello { id: number; nome: string }
interface Bicicletta { id: number; modello: Modello }
interface StockBicicletta { id: number; quantita: number; inManutenzione: number; biciclettaId: number; bicicletta: Bicicletta }
interface Location { id: number; nome: string; indirizzo: string; prezzoMezzaGiornata: number; stocks: StockBicicletta[] }
interface Accessorio { id: number; nome: string; prezzo: number }
interface Assicurazione { id: number; tipo: string; dettagli: string; prezzo: number }
interface Prenotazione {
  id: number
  dataRitiro: string
  dataOreConsegna: string
  stato: StatoPrenotazione
  totalePagato: number
  noteProblemi?: string
  utente: { firstName: string; lastName: string; email: string }
  bicicletta: Bicicletta
  location: Location
  copertura: Assicurazione
  accessori: Accessorio[]
}
interface Statistiche {
  totalBookings: number
  totalRevenue: number
  shopPerformance: { name: string; revenue: number }[]
  mostUsedBikes: { model: string; rentals: number }[]
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const API = '/backoffice'

const statoLabel: Record<StatoPrenotazione, string> = {
  PENDING: 'In attesa',
  PICKED_UP: 'Ritirata',
  RETURNED: 'Restituita',
  LATE: 'In ritardo',
  DAMAGED: 'Danneggiata',
  CANCELLED: 'Annullata'
}

const statoColor: Record<StatoPrenotazione, string> = {
  PENDING: '#f59e0b',
  PICKED_UP: '#3b82f6',
  RETURNED: '#10b981',
  LATE: '#f97316',
  DAMAGED: '#ef4444',
  CANCELLED: '#6b7280'
}

function fmt(n: number) { return `€${n.toFixed(2)}` }
function fmtDate(d: string) { return new Date(d).toLocaleDateString('it-IT', { day: '2-digit', month: 'short', year: 'numeric' }) }

// ─── Sub-components ───────────────────────────────────────────────────────────

function Toast({ msg, type, onClose }: { msg: string; type: 'ok' | 'err'; onClose: () => void }) {
  useEffect(() => { const t = setTimeout(onClose, 3500); return () => clearTimeout(t) }, [onClose])
  return (
    <div style={{
      position: 'fixed', bottom: 24, right: 24, zIndex: 9999,
      background: type === 'ok' ? '#10b981' : '#ef4444',
      color: '#fff', padding: '12px 20px', borderRadius: 10,
      fontFamily: 'var(--font-body)', fontSize: 14, fontWeight: 600,
      boxShadow: '0 8px 32px rgba(0,0,0,0.25)',
      animation: 'slideUp 0.25s ease'
    }}>
      {msg}
    </div>
  )
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 style={{
      fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 700,
      color: 'var(--text-primary)', marginBottom: 20, letterSpacing: '-0.5px',
      borderLeft: '3px solid var(--accent)', paddingLeft: 12
    }}>{children}</h2>
  )
}

function Card({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{
      background: 'var(--card-bg)', border: '1px solid var(--border)',
      borderRadius: 14, padding: '20px 24px',
      boxShadow: '0 2px 12px rgba(0,0,0,0.06)', ...style
    }}>{children}</div>
  )
}

function Btn({ children, onClick, variant = 'primary', small, disabled }: {
  children: React.ReactNode; onClick?: () => void
  variant?: 'primary' | 'ghost' | 'danger' | 'success'; small?: boolean; disabled?: boolean
}) {
  const bg: Record<string, string> = {
    primary: 'var(--accent)', ghost: 'transparent', danger: '#ef4444', success: '#10b981'
  }
  const col: Record<string, string> = {
    primary: '#fff', ghost: 'var(--text-secondary)', danger: '#fff', success: '#fff'
  }
  return (
    <button onClick={onClick} disabled={disabled} style={{
      background: bg[variant], color: col[variant],
      border: variant === 'ghost' ? '1px solid var(--border)' : 'none',
      borderRadius: 8, padding: small ? '5px 12px' : '9px 18px',
      fontSize: small ? 12 : 13, fontWeight: 600, cursor: disabled ? 'not-allowed' : 'pointer',
      fontFamily: 'var(--font-body)', opacity: disabled ? 0.5 : 1,
      transition: 'opacity 0.15s, transform 0.1s',
    }}>{children}</button>
  )
}

function Input({ label, value, onChange, type = 'text', placeholder }: {
  label?: string; value: string; onChange: (v: string) => void
  type?: string; placeholder?: string
}) {
  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      {label && <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</span>}
      <input
        type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        style={{
          background: 'var(--input-bg)', border: '1px solid var(--border)',
          borderRadius: 8, padding: '8px 12px', color: 'var(--text-primary)',
          fontFamily: 'var(--font-body)', fontSize: 13, outline: 'none',
          transition: 'border-color 0.15s'
        }}
      />
    </label>
  )
}

// ─── Tab: Configurazione ──────────────────────────────────────────────────────

function TabConfig({ negozi, accessori, assicurazioni, onSuccess, onError }: {
  negozi: Location[]; accessori: Accessorio[]; assicurazioni: Assicurazione[]
  onSuccess: (m: string) => void; onError: (m: string) => void
}) {
  const [editNeg, setEditNeg] = useState<Record<number, Partial<Location>>>({})
  const [editAcc, setEditAcc] = useState<Record<number, Partial<Accessorio>>>({})
  const [editAss, setEditAss] = useState<Record<number, Partial<Assicurazione>>>({})

  const saveNeg = async (id: number, orig: Location) => {
    const d = editNeg[id] || {}
    try {
      await api.post(API, { action: 'update_config', shopId: id, ...d })
      onSuccess('Negozio aggiornato')
    } catch (e: any) { onError(e.message) }
  }
  const saveAcc = async (id: number) => {
    try {
      await api.post(API, { action: 'update_accessorio', accessorioId: id, ...editAcc[id] })
      onSuccess('Accessorio aggiornato')
    } catch (e: any) { onError(e.message) }
  }
  const saveAss = async (id: number) => {
    try {
      await api.post(API, { action: 'update_assicurazione', assicurazioneId: id, ...editAss[id] })
      onSuccess('Assicurazione aggiornata')
    } catch (e: any) { onError(e.message) }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
      {/* Negozi */}
      <section>
        <SectionTitle>Punti Vendita</SectionTitle>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
          {negozi.map(n => {
            const d = editNeg[n.id] || {}
            return (
              <Card key={n.id}>
                <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 16, marginBottom: 14, color: 'var(--text-primary)' }}>{n.nome}</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <Input label="Nome" value={d.nome ?? n.nome} onChange={v => setEditNeg(p => ({ ...p, [n.id]: { ...p[n.id], nome: v } }))} />
                  <Input label="Indirizzo" value={d.indirizzo ?? n.indirizzo} onChange={v => setEditNeg(p => ({ ...p, [n.id]: { ...p[n.id], indirizzo: v } }))} />
                  <Input label="Prezzo mezza giornata (€)" type="number" value={String(d.prezzoMezzaGiornata ?? n.prezzoMezzaGiornata)} onChange={v => setEditNeg(p => ({ ...p, [n.id]: { ...p[n.id], prezzoMezzaGiornata: parseFloat(v) } }))} />
                  <div style={{ marginTop: 4 }}><Btn onClick={() => saveNeg(n.id, n)} small>Salva</Btn></div>
                </div>
              </Card>
            )
          })}
        </div>
      </section>

      {/* Accessori */}
      <section>
        <SectionTitle>Accessori</SectionTitle>
        <Card>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: 'var(--font-body)', fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                {['Nome', 'Prezzo (€)', ''].map(h => <th key={h} style={{ textAlign: 'left', padding: '6px 10px', color: 'var(--text-secondary)', fontWeight: 600, fontSize: 11, textTransform: 'uppercase' }}>{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {accessori.map(a => {
                const d = editAcc[a.id] || {}
                return (
                  <tr key={a.id} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '8px 10px' }}>
                      <input value={d.nome ?? a.nome} onChange={e => setEditAcc(p => ({ ...p, [a.id]: { ...p[a.id], nome: e.target.value } }))}
                        style={{ background: 'var(--input-bg)', border: '1px solid var(--border)', borderRadius: 6, padding: '5px 8px', color: 'var(--text-primary)', fontFamily: 'var(--font-body)', fontSize: 13, width: '100%' }} />
                    </td>
                    <td style={{ padding: '8px 10px', width: 120 }}>
                      <input type="number" value={d.prezzo ?? a.prezzo} onChange={e => setEditAcc(p => ({ ...p, [a.id]: { ...p[a.id], prezzo: parseFloat(e.target.value) } }))}
                        style={{ background: 'var(--input-bg)', border: '1px solid var(--border)', borderRadius: 6, padding: '5px 8px', color: 'var(--text-primary)', fontFamily: 'var(--font-body)', fontSize: 13, width: '100%' }} />
                    </td>
                    <td style={{ padding: '8px 10px', width: 80 }}><Btn onClick={() => saveAcc(a.id)} small>Salva</Btn></td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </Card>
      </section>

      {/* Assicurazioni */}
      <section>
        <SectionTitle>Assicurazioni</SectionTitle>
        <Card>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: 'var(--font-body)', fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                {['Tipo', 'Dettagli', 'Prezzo (€)', ''].map(h => <th key={h} style={{ textAlign: 'left', padding: '6px 10px', color: 'var(--text-secondary)', fontWeight: 600, fontSize: 11, textTransform: 'uppercase' }}>{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {assicurazioni.map(a => {
                const d = editAss[a.id] || {}
                return (
                  <tr key={a.id} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '8px 10px', width: 120 }}>
                      <input value={d.tipo ?? a.tipo} onChange={e => setEditAss(p => ({ ...p, [a.id]: { ...p[a.id], tipo: e.target.value } }))}
                        style={{ background: 'var(--input-bg)', border: '1px solid var(--border)', borderRadius: 6, padding: '5px 8px', color: 'var(--text-primary)', fontFamily: 'var(--font-body)', fontSize: 13, width: '100%' }} />
                    </td>
                    <td style={{ padding: '8px 10px' }}>
                      <input value={d.dettagli ?? a.dettagli} onChange={e => setEditAss(p => ({ ...p, [a.id]: { ...p[a.id], dettagli: e.target.value } }))}
                        style={{ background: 'var(--input-bg)', border: '1px solid var(--border)', borderRadius: 6, padding: '5px 8px', color: 'var(--text-primary)', fontFamily: 'var(--font-body)', fontSize: 13, width: '100%' }} />
                    </td>
                    <td style={{ padding: '8px 10px', width: 110 }}>
                      <input type="number" value={d.prezzo ?? a.prezzo} onChange={e => setEditAss(p => ({ ...p, [a.id]: { ...p[a.id], prezzo: parseFloat(e.target.value) } }))}
                        style={{ background: 'var(--input-bg)', border: '1px solid var(--border)', borderRadius: 6, padding: '5px 8px', color: 'var(--text-primary)', fontFamily: 'var(--font-body)', fontSize: 13, width: '100%' }} />
                    </td>
                    <td style={{ padding: '8px 10px', width: 80 }}><Btn onClick={() => saveAss(a.id)} small>Salva</Btn></td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </Card>
      </section>
    </div>
  )
}

// ─── Tab: Prenotazioni ────────────────────────────────────────────────────────

function TabPrenotazioni({ negozi, onSuccess, onError }: {
  negozi: Location[]; onSuccess: (m: string) => void; onError: (m: string) => void
}) {
  const [prenotazioni, setPrenotazioni] = useState<Prenotazione[]>([])
  const [loading, setLoading] = useState(false)
  const [filtUtente, setFiltUtente] = useState('')
  const [filtData, setFiltData] = useState('')
  const [filtLocation, setFiltLocation] = useState('')
  const [modalPren, setModalPren] = useState<Prenotazione | null>(null)
  const [nuovoStato, setNuovoStato] = useState<StatoPrenotazione>('PENDING')
  const [note, setNote] = useState('')
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ action: 'prenotazioni' })
      if (filtUtente) params.set('utente', filtUtente)
      if (filtData) params.set('data', filtData)
      if (filtLocation) params.set('locationId', filtLocation)
      const { data } = await api.get(`${API}?${params}`)
      setPrenotazioni(data)
    } catch (e: any) { onError(e.message) }
    finally { setLoading(false) }
  }, [filtUtente, filtData, filtLocation, onError])

  useEffect(() => { load() }, [])

  const aggiornaStato = async () => {
    if (!modalPren) return
    setSaving(true)
    try {
      await api.post(API, { action: 'update_stato_prenotazione', prenotazioneId: modalPren.id, stato: nuovoStato, noteProblemi: note || undefined })
      onSuccess(`Stato aggiornato: ${statoLabel[nuovoStato]}`)
      setModalPren(null)
      load()
    } catch (e: any) { onError(e.message) }
    finally { setSaving(false) }
  }

  const openModal = (p: Prenotazione) => {
    setModalPren(p)
    setNuovoStato(p.stato)
    setNote(p.noteProblemi || '')
  }

  return (
    <div>
      {/* Filtri */}
      <Card style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div style={{ flex: 1, minWidth: 160 }}>
            <Input label="Utente" value={filtUtente} onChange={setFiltUtente} placeholder="Nome o cognome" />
          </div>
          <div style={{ flex: 1, minWidth: 140 }}>
            <Input label="Data ritiro" type="date" value={filtData} onChange={setFiltData} />
          </div>
          <div style={{ flex: 1, minWidth: 160 }}>
            <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Negozio</span>
              <select value={filtLocation} onChange={e => setFiltLocation(e.target.value)}
                style={{ background: 'var(--input-bg)', border: '1px solid var(--border)', borderRadius: 8, padding: '8px 12px', color: 'var(--text-primary)', fontFamily: 'var(--font-body)', fontSize: 13 }}>
                <option value="">Tutti</option>
                {negozi.map(n => <option key={n.id} value={n.id}>{n.nome}</option>)}
              </select>
            </label>
          </div>
          <Btn onClick={load}>Cerca</Btn>
          <Btn variant="ghost" onClick={() => { setFiltUtente(''); setFiltData(''); setFiltLocation(''); }}>Reset</Btn>
        </div>
      </Card>

      {/* Tabella */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-secondary)', fontFamily: 'var(--font-body)' }}>Caricamento…</div>
      ) : (
        <Card style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: 'var(--font-body)', fontSize: 13 }}>
              <thead>
                <tr style={{ background: 'var(--table-head)' }}>
                  {['#', 'Utente', 'Bici', 'Negozio', 'Ritiro', 'Restituzione', 'Totale', 'Stato', ''].map(h => (
                    <th key={h} style={{ textAlign: 'left', padding: '12px 16px', color: 'var(--text-secondary)', fontWeight: 600, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {prenotazioni.length === 0 ? (
                  <tr><td colSpan={9} style={{ textAlign: 'center', padding: 40, color: 'var(--text-secondary)' }}>Nessuna prenotazione trovata</td></tr>
                ) : prenotazioni.map((p, i) => (
                  <tr key={p.id} style={{ borderBottom: '1px solid var(--border)', background: i % 2 === 0 ? 'transparent' : 'var(--row-alt)' }}>
                    <td style={{ padding: '12px 16px', color: 'var(--text-secondary)', fontSize: 11 }}>#{p.id}</td>
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{p.utente.firstName} {p.utente.lastName}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{p.utente.email}</div>
                    </td>
                    <td style={{ padding: '12px 16px', color: 'var(--text-primary)' }}>{p.bicicletta.modello.nome}</td>
                    <td style={{ padding: '12px 16px', color: 'var(--text-primary)' }}>{p.location.nome}</td>
                    <td style={{ padding: '12px 16px', color: 'var(--text-primary)', whiteSpace: 'nowrap' }}>{fmtDate(p.dataRitiro)}</td>
                    <td style={{ padding: '12px 16px', color: 'var(--text-primary)', whiteSpace: 'nowrap' }}>{fmtDate(p.dataOreConsegna)}</td>
                    <td style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--accent)' }}>{fmt(p.totalePagato)}</td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{ background: statoColor[p.stato] + '22', color: statoColor[p.stato], borderRadius: 6, padding: '3px 9px', fontSize: 11, fontWeight: 700 }}>
                        {statoLabel[p.stato]}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <Btn onClick={() => openModal(p)} small variant="ghost">Gestisci</Btn>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Modal gestione stato */}
      {modalPren && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          onClick={e => { if (e.target === e.currentTarget) setModalPren(null) }}>
          <div style={{ background: 'var(--card-bg)', borderRadius: 16, padding: 28, width: '100%', maxWidth: 440, boxShadow: '0 24px 64px rgba(0,0,0,0.3)' }}>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>
              Prenotazione #{modalPren.id}
            </div>
            <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 20, fontFamily: 'var(--font-body)' }}>
              {modalPren.utente.firstName} {modalPren.utente.lastName} — {modalPren.bicicletta.modello.nome}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Nuovo stato</span>
                <select value={nuovoStato} onChange={e => setNuovoStato(e.target.value as StatoPrenotazione)}
                  style={{ background: 'var(--input-bg)', border: '1px solid var(--border)', borderRadius: 8, padding: '8px 12px', color: 'var(--text-primary)', fontFamily: 'var(--font-body)', fontSize: 13 }}>
                  {(Object.keys(statoLabel) as StatoPrenotazione[]).map(s => (
                    <option key={s} value={s}>{statoLabel[s]}</option>
                  ))}
                </select>
              </label>
              {(nuovoStato === 'DAMAGED' || nuovoStato === 'LATE') && (
                <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Note problema</span>
                  <textarea value={note} onChange={e => setNote(e.target.value)} rows={3}
                    placeholder="Descrivi il danno o il ritardo…"
                    style={{ background: 'var(--input-bg)', border: '1px solid var(--border)', borderRadius: 8, padding: '8px 12px', color: 'var(--text-primary)', fontFamily: 'var(--font-body)', fontSize: 13, resize: 'vertical' }} />
                </label>
              )}
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 6 }}>
                <Btn variant="ghost" onClick={() => setModalPren(null)}>Annulla</Btn>
                <Btn onClick={aggiornaStato} disabled={saving}>{saving ? 'Salvataggio…' : 'Conferma'}</Btn>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Tab: Stock ────────────────────────────────────────────────────────────────

function TabStock({ negozi, onSuccess, onError, reload }: {
  negozi: Location[]; onSuccess: (m: string) => void; onError: (m: string) => void; reload: () => void
}) {
  const [selNegozio, setSelNegozio] = useState<number | null>(negozi[0]?.id ?? null)
  const [loading, setLoading] = useState(false)

  const negozio = negozi.find(n => n.id === selNegozio)

  const stockAction = async (locationId: number, biciclettaId: number, azione_stock: string) => {
    setLoading(true)
    try {
      await api.post(API, { action: 'update_stock', locationId, biciclettaId, azione_stock })
      onSuccess('Stock aggiornato')
      reload()
    } catch (e: any) { onError(e.message) }
    finally { setLoading(false) }
  }

  return (
    <div>
      {/* Selezione negozio */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 24, flexWrap: 'wrap' }}>
        {negozi.map(n => (
          <button key={n.id} onClick={() => setSelNegozio(n.id)}
            style={{
              padding: '8px 18px', borderRadius: 8, border: '1px solid var(--border)',
              background: selNegozio === n.id ? 'var(--accent)' : 'var(--card-bg)',
              color: selNegozio === n.id ? '#fff' : 'var(--text-primary)',
              fontFamily: 'var(--font-body)', fontSize: 13, fontWeight: 600, cursor: 'pointer',
              transition: 'all 0.15s'
            }}>{n.nome}</button>
        ))}
      </div>

      {negozio && (
        <>
          <SectionTitle>{negozio.nome} — Inventario</SectionTitle>
          {negozio.stocks.length === 0 ? (
            <Card><div style={{ color: 'var(--text-secondary)', fontFamily: 'var(--font-body)', fontSize: 14 }}>Nessun modello in stock per questo negozio.</div></Card>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 14 }}>
              {negozio.stocks.map(s => {
                const disponibili = s.quantita - s.inManutenzione
                return (
                  <Card key={s.id}>
                    <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 15, color: 'var(--text-primary)', marginBottom: 12 }}>
                      {s.bicicletta.modello.nome}
                    </div>
                    <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--accent)' }}>{s.quantita}</div>
                        <div style={{ fontSize: 10, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Totale</div>
                      </div>
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: 22, fontWeight: 800, color: '#10b981' }}>{disponibili}</div>
                        <div style={{ fontSize: 10, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Disponibili</div>
                      </div>
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: 22, fontWeight: 800, color: '#f59e0b' }}>{s.inManutenzione}</div>
                        <div style={{ fontSize: 10, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>In officina</div>
                      </div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                      <Btn small onClick={() => stockAction(negozio.id, s.biciclettaId, 'incrementa')} disabled={loading}>＋ Aggiungi</Btn>
                      <Btn small variant="ghost" onClick={() => stockAction(negozio.id, s.biciclettaId, 'riduce')} disabled={loading}>－ Rimuovi</Btn>
                      <Btn small variant="danger" onClick={() => stockAction(negozio.id, s.biciclettaId, 'manutenzione_in')} disabled={loading}>🔧 In officina</Btn>
                      <Btn small variant="success" onClick={() => stockAction(negozio.id, s.biciclettaId, 'manutenzione_out')} disabled={loading}>✓ Da officina</Btn>
                    </div>
                  </Card>
                )
              })}
            </div>
          )}
        </>
      )}
    </div>
  )
}

// ─── Tab: Statistiche ─────────────────────────────────────────────────────────

function TabStatistiche({ onError }: { onError: (m: string) => void }) {
  const [stats, setStats] = useState<Statistiche | null>(null)
  const [loading, setLoading] = useState(false)
  const [da, setDa] = useState('')
  const [a, setA] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ action: 'statistiche' })
      if (da) params.set('da', da)
      if (a) params.set('a', a)
      const { data } = await api.get(`${API}?${params}`)
      setStats(data)
    } catch (e: any) { onError(e.message) }
    finally { setLoading(false) }
  }, [da, a, onError])

  useEffect(() => { load() }, [])

  const maxRev = stats ? Math.max(...stats.shopPerformance.map(s => s.revenue), 1) : 1
  const maxRent = stats ? Math.max(...stats.mostUsedBikes.map(b => b.rentals), 1) : 1

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
      {/* Filtro periodo */}
      <Card>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div style={{ flex: 1, minWidth: 140 }}><Input label="Dal" type="date" value={da} onChange={setDa} /></div>
          <div style={{ flex: 1, minWidth: 140 }}><Input label="Al" type="date" value={a} onChange={setA} /></div>
          <Btn onClick={load}>Aggiorna</Btn>
          <Btn variant="ghost" onClick={() => { setDa(''); setA(''); }}>Tutto lo storico</Btn>
        </div>
      </Card>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 60, color: 'var(--text-secondary)', fontFamily: 'var(--font-body)' }}>Caricamento statistiche…</div>
      ) : stats ? (
        <>
          {/* KPI */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 16 }}>
            {[
              { label: 'Prenotazioni totali', value: stats.totalBookings.toLocaleString('it-IT'), color: '#3b82f6' },
              { label: 'Ricavi totali', value: fmt(stats.totalRevenue), color: '#10b981' },
              { label: 'Negozi attivi', value: stats.shopPerformance.length, color: '#f59e0b' },
              { label: 'Modelli top', value: stats.mostUsedBikes.length, color: '#8b5cf6' },
            ].map(k => (
              <Card key={k.label} style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 28, fontWeight: 800, color: k.color, fontFamily: 'var(--font-display)' }}>{k.value}</div>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4, fontFamily: 'var(--font-body)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{k.label}</div>
              </Card>
            ))}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 20 }}>
            {/* Performance negozi */}
            <Card>
              <SectionTitle>Performance Negozi</SectionTitle>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {stats.shopPerformance.sort((a, b) => b.revenue - a.revenue).map(s => (
                  <div key={s.name}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                      <span style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--text-primary)', fontWeight: 600 }}>{s.name}</span>
                      <span style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--accent)', fontWeight: 700 }}>{fmt(s.revenue)}</span>
                    </div>
                    <div style={{ height: 6, background: 'var(--border)', borderRadius: 99 }}>
                      <div style={{ height: 6, borderRadius: 99, background: 'var(--accent)', width: `${(s.revenue / maxRev) * 100}%`, transition: 'width 0.4s ease' }} />
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            {/* Bici più usate */}
            <Card>
              <SectionTitle>Bici Più Usate</SectionTitle>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {stats.mostUsedBikes.map((b, i) => (
                  <div key={b.model}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                        <span style={{ fontFamily: 'var(--font-display)', fontSize: 11, fontWeight: 800, color: '#fff', background: ['#f59e0b', '#94a3b8', '#cd7c3c', '#6b7280', '#6b7280'][i] ?? '#6b7280', borderRadius: 4, padding: '1px 6px' }}>#{i + 1}</span>
                        <span style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--text-primary)', fontWeight: 600 }}>{b.model}</span>
                      </div>
                      <span style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--text-secondary)', fontWeight: 600 }}>{b.rentals} noleggi</span>
                    </div>
                    <div style={{ height: 6, background: 'var(--border)', borderRadius: 99 }}>
                      <div style={{ height: 6, borderRadius: 99, background: '#8b5cf6', width: `${(b.rentals / maxRent) * 100}%`, transition: 'width 0.4s ease' }} />
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </>
      ) : null}
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

type Tab = 'config' | 'prenotazioni' | 'stock' | 'statistiche'

const tabs: { id: Tab; label: string; icon: string }[] = [
  { id: 'config', label: 'Configurazione', icon: '⚙️' },
  { id: 'prenotazioni', label: 'Prenotazioni', icon: '📋' },
  { id: 'stock', label: 'Stock', icon: '🚲' },
  { id: 'statistiche', label: 'Statistiche', icon: '📊' },
]

export default function BackofficePage() {
  const [activeTab, setActiveTab] = useState<Tab>('prenotazioni')
  const [config, setConfig] = useState<{ negozi: Location[]; accessori: Accessorio[]; assicurazioni: Assicurazione[] } | null>(null)
  const [loadingConfig, setLoadingConfig] = useState(true)
  const [toast, setToast] = useState<{ msg: string; type: 'ok' | 'err' } | null>(null)

  const loadConfig = useCallback(async () => {
    setLoadingConfig(true)
    try {
      const { data } = await api.get(`${API}?action=config`)
      setConfig(data)
    } catch (e: any) {
      setToast({ msg: e.message, type: 'err' })
    } finally {
      setLoadingConfig(false)
    }
  }, [])

  useEffect(() => { loadConfig() }, [loadConfig])

  const onSuccess = (msg: string) => setToast({ msg, type: 'ok' })
  const onError = (msg: string) => setToast({ msg, type: 'err' })

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@400;500;600&display=swap');

        :root {
          --font-display: 'Syne', sans-serif;
          --font-body: 'DM Sans', sans-serif;
          --bg: #0f1117;
          --sidebar-bg: #161923;
          --card-bg: #1c2130;
          --table-head: #1a1f2e;
          --row-alt: #181d2a;
          --border: #2a3148;
          --text-primary: #e8ecf4;
          --text-secondary: #7a8aab;
          --accent: #4f7dff;
          --input-bg: #131720;
        }

        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: var(--bg); }

        @keyframes slideUp {
          from { transform: translateY(12px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }

        input:focus, select:focus, textarea:focus {
          border-color: var(--accent) !important;
          outline: none;
        }

        ::-webkit-scrollbar { width: 5px; height: 5px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: var(--border); border-radius: 99px; }
      `}</style>

      <div style={{ display: 'flex', minHeight: '100vh', fontFamily: 'var(--font-body)' }}>
        {/* Sidebar */}
        <aside style={{
          width: 220, background: 'var(--sidebar-bg)', borderRight: '1px solid var(--border)',
          display: 'flex', flexDirection: 'column', padding: '28px 0', flexShrink: 0,
          position: 'sticky', top: 0, height: '100vh'
        }}>
          <div style={{ padding: '0 22px 28px', borderBottom: '1px solid var(--border)' }}>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.5px' }}>
              🚲 BikeBack
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 2 }}>Pannello operativo</div>
          </div>
          <nav style={{ padding: '16px 10px', display: 'flex', flexDirection: 'column', gap: 2 }}>
            {tabs.map(t => (
              <button key={t.id} onClick={() => setActiveTab(t.id)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '10px 14px', borderRadius: 9, border: 'none', cursor: 'pointer',
                  background: activeTab === t.id ? 'var(--accent)' : 'transparent',
                  color: activeTab === t.id ? '#fff' : 'var(--text-secondary)',
                  fontFamily: 'var(--font-body)', fontSize: 13, fontWeight: 600,
                  textAlign: 'left', transition: 'all 0.15s'
                }}>
                <span>{t.icon}</span>
                <span>{t.label}</span>
              </button>
            ))}
          </nav>
        </aside>

        {/* Main */}
        <main style={{ flex: 1, padding: '32px 36px', minWidth: 0, overflowY: 'auto' }}>
          <div style={{ maxWidth: 1100 }}>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.5px', marginBottom: 28 }}>
              {tabs.find(t => t.id === activeTab)?.icon} {tabs.find(t => t.id === activeTab)?.label}
            </div>

            {loadingConfig ? (
              <div style={{ color: 'var(--text-secondary)', padding: 60, textAlign: 'center' }}>Caricamento configurazione…</div>
            ) : config ? (
              <>
                {activeTab === 'config' && (
                  <TabConfig negozi={config.negozi} accessori={config.accessori} assicurazioni={config.assicurazioni} onSuccess={onSuccess} onError={onError} />
                )}
                {activeTab === 'prenotazioni' && (
                  <TabPrenotazioni negozi={config.negozi} onSuccess={onSuccess} onError={onError} />
                )}
                {activeTab === 'stock' && (
                  <TabStock negozi={config.negozi} onSuccess={onSuccess} onError={onError} reload={loadConfig} />
                )}
                {activeTab === 'statistiche' && (
                  <TabStatistiche onError={onError} />
                )}
              </>
            ) : (
              <div style={{ color: '#ef4444', fontFamily: 'var(--font-body)' }}>Errore nel caricamento della configurazione.</div>
            )}
          </div>
        </main>
      </div>

      {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
    </>
  )
}