'use client'

import api from '@/lib/axios'
import { useState, useEffect, useCallback, useRef } from 'react'

// ─── Types ────────────────────────────────────────────────────────────────────

type StatoPrenotazione = 'PENDING' | 'PICKED_UP' | 'RETURNED' | 'LATE' | 'DAMAGED' | 'CANCELLED'
type Tab = 'config' | 'prenotazioni' | 'stock' | 'statistiche'

interface Modello      { id: number; nome: string }
interface Tipologia    { id: number; nome: string }
interface Dimensione   { id: number; taglia: string; quantitaElettrico: number; quantitaMuscolare: number }
interface Bicicletta   { id: number; modello: Modello; tipologie: Tipologia[]; dimensioni: Dimensione[] }
interface StockEntry   { id: number; quantita: number; inManutenzione: number; biciclettaId: number; bicicletta: Bicicletta }
interface Location     { id: number; nome: string; indirizzo: string; prezzoMezzaGiornata: number; stocks: StockEntry[] }
interface Accessorio   { id: number; nome: string; prezzo: number }
interface Assicurazione{ id: number; tipo: string; dettagli: string; prezzo: number }
interface Prenotazione {
  id: number; dataRitiro: string; dataOreConsegna: string
  stato: StatoPrenotazione; totalePagato: number; noteProblemi?: string
  utente: { firstName: string; lastName: string; email: string }
  bicicletta: Bicicletta; location: Location; copertura: Assicurazione; accessori: Accessorio[]
}
interface Statistiche {
  totalBookings: number; totalRevenue: number
  shopPerformance: { name: string; revenue: number }[]
  mostUsedBikes:   { model: string; rentals: number }[]
}
interface Catalogo { biciclette: Bicicletta[]; negozi: { id: number; nome: string }[]; modelli: Modello[]; tipologie: Tipologia[] }

// ─── Helpers ──────────────────────────────────────────────────────────────────

const API = '/backoffice'
const TAGLIE_ORDER = ['XS','S','M','L','XL','XXL']

const statoLabel: Record<StatoPrenotazione, string> = {
  PENDING:'In attesa', PICKED_UP:'Ritirata', RETURNED:'Restituita',
  LATE:'In ritardo', DAMAGED:'Danneggiata', CANCELLED:'Annullata'
}
const statoColor: Record<StatoPrenotazione, string> = {
  PENDING:'#f59e0b', PICKED_UP:'#3b82f6', RETURNED:'#10b981',
  LATE:'#f97316', DAMAGED:'#ef4444', CANCELLED:'#6b7280'
}

const fmt      = (n: number) => `€${n.toFixed(2)}`
const fmtDate  = (d: string) => new Date(d).toLocaleDateString('it-IT', { day:'2-digit', month:'short', year:'numeric' })
const isElettr = (nome: string) => nome.toLowerCase().includes('elettr')

// ─── Primitives ───────────────────────────────────────────────────────────────

function Toast({ msg, type, onClose }: { msg: string; type: 'ok'|'err'; onClose: () => void }) {
  useEffect(() => { const t = setTimeout(onClose, 3500); return () => clearTimeout(t) }, [onClose])
  return (
    <div style={{
      position:'fixed', bottom:24, right:24, zIndex:9999,
      background: type==='ok' ? '#10b981' : '#ef4444',
      color:'#fff', padding:'12px 20px', borderRadius:10,
      fontFamily:'var(--font-body)', fontSize:14, fontWeight:600,
      boxShadow:'0 8px 32px rgba(0,0,0,0.25)', animation:'slideUp 0.25s ease'
    }}>{msg}</div>
  )
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 style={{
      fontFamily:'var(--font-display)', fontSize:20, fontWeight:700,
      color:'var(--text-primary)', marginBottom:16, letterSpacing:'-0.5px',
      borderLeft:'3px solid var(--accent)', paddingLeft:12
    }}>{children}</h2>
  )
}

function Card({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{
      background:'var(--card-bg)', border:'1px solid var(--border)',
      borderRadius:14, padding:'20px 24px',
      boxShadow:'0 2px 12px rgba(0,0,0,0.06)', ...style
    }}>{children}</div>
  )
}

function Btn({ children, onClick, variant='primary', small, disabled, type='button' }: {
  children: React.ReactNode; onClick?: () => void; type?: 'button'|'submit'
  variant?: 'primary'|'ghost'|'danger'|'success'|'warning'; small?: boolean; disabled?: boolean
}) {
  const themes: Record<string,[string,string]> = {
    primary: ['var(--accent)','#fff'],
    ghost:   ['transparent','var(--text-secondary)'],
    danger:  ['#ef4444','#fff'],
    success: ['#10b981','#fff'],
    warning: ['#f59e0b','#fff'],
  }
  const [bg, col] = themes[variant]
  return (
    <button type={type} onClick={onClick} disabled={disabled} style={{
      background:bg, color:col,
      border: variant==='ghost' ? '1px solid var(--border)' : 'none',
      borderRadius:8, padding: small ? '5px 12px' : '9px 18px',
      fontSize: small ? 12 : 13, fontWeight:600,
      cursor: disabled ? 'not-allowed' : 'pointer',
      fontFamily:'var(--font-body)', opacity: disabled ? 0.5 : 1,
      transition:'opacity 0.15s',
    }}>{children}</button>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label style={{ display:'flex', flexDirection:'column', gap:4 }}>
      <span style={{ fontSize:11, fontWeight:600, color:'var(--text-secondary)', textTransform:'uppercase', letterSpacing:'0.05em' }}>{label}</span>
      {children}
    </label>
  )
}

function Inp({ value, onChange, type='text', placeholder, min }: {
  value: string; onChange: (v: string) => void; type?: string; placeholder?: string; min?: string
}) {
  return (
    <input type={type} value={value} placeholder={placeholder} min={min}
      onChange={e => onChange(e.target.value)}
      style={{ background:'var(--input-bg)', border:'1px solid var(--border)', borderRadius:8,
        padding:'8px 12px', color:'var(--text-primary)', fontFamily:'var(--font-body)', fontSize:13, outline:'none' }}
    />
  )
}

function Sel({ value, onChange, children }: {
  value: string; onChange: (v: string) => void; children: React.ReactNode
}) {
  return (
    <select value={value} onChange={e => onChange(e.target.value)}
      style={{ background:'var(--input-bg)', border:'1px solid var(--border)', borderRadius:8,
        padding:'8px 12px', color:'var(--text-primary)', fontFamily:'var(--font-body)', fontSize:13 }}>
      {children}
    </select>
  )
}

// Modale generica con overlay
function Modal({ title, subtitle, onClose, children, maxWidth=480 }: {
  title: string; subtitle?: string; onClose: () => void; children: React.ReactNode; maxWidth?: number
}) {
  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.6)', zIndex:1000,
      display:'flex', alignItems:'center', justifyContent:'center' }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div style={{ background:'var(--card-bg)', borderRadius:16, padding:28,
        width:'100%', maxWidth, boxShadow:'0 24px 64px rgba(0,0,0,0.4)',
        maxHeight:'90vh', overflowY:'auto' }}>
        <div style={{ fontFamily:'var(--font-display)', fontSize:18, fontWeight:700,
          color:'var(--text-primary)', marginBottom: subtitle ? 4 : 20 }}>{title}</div>
        {subtitle && <div style={{ fontSize:13, color:'var(--text-secondary)',
          marginBottom:20, fontFamily:'var(--font-body)' }}>{subtitle}</div>}
        {children}
      </div>
    </div>
  )
}

// ─── Tab: Configurazione ──────────────────────────────────────────────────────

function TabConfig({ negozi, accessori, assicurazioni, onSuccess, onError, reload }: {
  negozi: Location[]; accessori: Accessorio[]; assicurazioni: Assicurazione[]
  onSuccess: (m: string) => void; onError: (m: string) => void; reload: () => void
}) {
  // ── Negozi ──
  const [editNeg, setEditNeg] = useState<Record<number, Partial<Location>>>({})
  const [showAddLoc, setShowAddLoc] = useState(false)
  const [newLoc, setNewLoc] = useState({ nome:'', indirizzo:'', prezzoMezzaGiornata:'' })
  const [savingLoc, setSavingLoc] = useState(false)

  // ── Accessori ──
  const [editAcc, setEditAcc] = useState<Record<number, Partial<Accessorio>>>({})
  const [showAddAcc, setShowAddAcc] = useState(false)
  const [newAcc, setNewAcc] = useState({ nome:'', prezzo:'' })
  const [savingAcc, setSavingAcc] = useState(false)

  // ── Assicurazioni ──
  const [editAss, setEditAss] = useState<Record<number, Partial<Assicurazione>>>({})
  const [showAddAss, setShowAddAss] = useState(false)
  const [newAss, setNewAss] = useState({ tipo:'', dettagli:'', prezzo:'' })
  const [savingAss, setSavingAss] = useState(false)

  const inlineInput = (val: string, onChange: (v:string)=>void, type='text') => (
    <input type={type} value={val} onChange={e => onChange(e.target.value)}
      style={{ background:'var(--input-bg)', border:'1px solid var(--border)', borderRadius:6,
        padding:'5px 8px', color:'var(--text-primary)', fontFamily:'var(--font-body)', fontSize:13, width:'100%' }} />
  )

  const saveNeg = async (id: number) => {
    try {
      await api.post(API, { action:'update_config', shopId:id, ...editNeg[id] })
      onSuccess('Negozio aggiornato'); reload()
    } catch (e: any) { onError(e.message) }
  }
  const deleteLoc = async (id: number) => {
    if (!confirm('Eliminare questo negozio?')) return
    try {
      await api.post(API, { action:'delete_location', locationId:id })
      onSuccess('Negozio eliminato'); reload()
    } catch (e: any) { onError(e.message) }
  }
  const createLoc = async () => {
    if (!newLoc.nome || !newLoc.indirizzo) return onError('Nome e indirizzo obbligatori')
    setSavingLoc(true)
    try {
      await api.post(API, { action:'create_location', ...newLoc })
      onSuccess('Negozio creato'); setShowAddLoc(false); setNewLoc({ nome:'', indirizzo:'', prezzoMezzaGiornata:'' }); reload()
    } catch (e: any) { onError(e.message) }
    finally { setSavingLoc(false) }
  }

  const saveAcc = async (id: number) => {
    try {
      await api.post(API, { action:'update_accessorio', accessorioId:id, ...editAcc[id] })
      onSuccess('Accessorio aggiornato'); reload()
    } catch (e: any) { onError(e.message) }
  }
  const deleteAcc = async (id: number) => {
    if (!confirm('Eliminare questo accessorio?')) return
    try {
      await api.post(API, { action:'delete_accessorio', accessorioId:id })
      onSuccess('Accessorio eliminato'); reload()
    } catch (e: any) { onError(e.message) }
  }
  const createAcc = async () => {
    if (!newAcc.nome) return onError('Nome obbligatorio')
    setSavingAcc(true)
    try {
      await api.post(API, { action:'create_accessorio', ...newAcc })
      onSuccess('Accessorio creato'); setShowAddAcc(false); setNewAcc({ nome:'', prezzo:'' }); reload()
    } catch (e: any) { onError(e.message) }
    finally { setSavingAcc(false) }
  }

  const saveAss = async (id: number) => {
    try {
      await api.post(API, { action:'update_assicurazione', assicurazioneId:id, ...editAss[id] })
      onSuccess('Assicurazione aggiornata'); reload()
    } catch (e: any) { onError(e.message) }
  }
  const deleteAss = async (id: number) => {
    if (!confirm('Eliminare questa assicurazione?')) return
    try {
      await api.post(API, { action:'delete_assicurazione', assicurazioneId:id })
      onSuccess('Assicurazione eliminata'); reload()
    } catch (e: any) { onError(e.message) }
  }
  const createAss = async () => {
    if (!newAss.tipo || !newAss.dettagli) return onError('Tipo e dettagli obbligatori')
    setSavingAss(true)
    try {
      await api.post(API, { action:'create_assicurazione', ...newAss })
      onSuccess('Assicurazione creata'); setShowAddAss(false); setNewAss({ tipo:'', dettagli:'', prezzo:'' }); reload()
    } catch (e: any) { onError(e.message) }
    finally { setSavingAss(false) }
  }

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:36 }}>

      {/* ── NEGOZI ── */}
      <section>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16 }}>
          <SectionTitle>Punti Vendita</SectionTitle>
          <Btn small onClick={() => setShowAddLoc(true)}>＋ Nuovo negozio</Btn>
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(300px, 1fr))', gap:14 }}>
          {negozi.map(n => {
            const d = editNeg[n.id] || {}
            return (
              <Card key={n.id}>
                <div style={{ fontFamily:'var(--font-display)', fontWeight:700, fontSize:15, marginBottom:14, color:'var(--text-primary)' }}>{n.nome}</div>
                <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                  <Field label="Nome">{inlineInput(d.nome ?? n.nome, v => setEditNeg(p => ({ ...p, [n.id]:{ ...p[n.id], nome:v } })))}</Field>
                  <Field label="Indirizzo">{inlineInput(d.indirizzo ?? n.indirizzo, v => setEditNeg(p => ({ ...p, [n.id]:{ ...p[n.id], indirizzo:v } })))}</Field>
                  <Field label="Prezzo mezza giornata (€)">{inlineInput(String(d.prezzoMezzaGiornata ?? n.prezzoMezzaGiornata), v => setEditNeg(p => ({ ...p, [n.id]:{ ...p[n.id], prezzoMezzaGiornata:parseFloat(v) } })), 'number')}</Field>
                  <div style={{ display:'flex', gap:8, marginTop:4 }}>
                    <Btn small onClick={() => saveNeg(n.id)}>Salva</Btn>
                    <Btn small variant="danger" onClick={() => deleteLoc(n.id)}>Elimina</Btn>
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      </section>

      {/* ── ACCESSORI ── */}
      <section>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16 }}>
          <SectionTitle>Accessori</SectionTitle>
          <Btn small onClick={() => setShowAddAcc(true)}>＋ Nuovo accessorio</Btn>
        </div>
        <Card>
          <table style={{ width:'100%', borderCollapse:'collapse', fontFamily:'var(--font-body)', fontSize:13 }}>
            <thead>
              <tr style={{ borderBottom:'1px solid var(--border)' }}>
                {['Nome','Prezzo (€)',''].map(h => <th key={h} style={{ textAlign:'left', padding:'6px 10px', color:'var(--text-secondary)', fontWeight:600, fontSize:11, textTransform:'uppercase' }}>{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {accessori.map(a => {
                const d = editAcc[a.id] || {}
                return (
                  <tr key={a.id} style={{ borderBottom:'1px solid var(--border)' }}>
                    <td style={{ padding:'8px 10px' }}>{inlineInput(d.nome ?? a.nome, v => setEditAcc(p => ({ ...p, [a.id]:{ ...p[a.id], nome:v } })))}</td>
                    <td style={{ padding:'8px 10px', width:130 }}>{inlineInput(String(d.prezzo ?? a.prezzo), v => setEditAcc(p => ({ ...p, [a.id]:{ ...p[a.id], prezzo:parseFloat(v) } })), 'number')}</td>
                    <td style={{ padding:'8px 10px', width:120 }}>
                      <div style={{ display:'flex', gap:6 }}>
                        <Btn small onClick={() => saveAcc(a.id)}>Salva</Btn>
                        <Btn small variant="danger" onClick={() => deleteAcc(a.id)}>✕</Btn>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </Card>
      </section>

      {/* ── ASSICURAZIONI ── */}
      <section>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16 }}>
          <SectionTitle>Assicurazioni</SectionTitle>
          <Btn small onClick={() => setShowAddAss(true)}>＋ Nuova assicurazione</Btn>
        </div>
        <Card>
          <table style={{ width:'100%', borderCollapse:'collapse', fontFamily:'var(--font-body)', fontSize:13 }}>
            <thead>
              <tr style={{ borderBottom:'1px solid var(--border)' }}>
                {['Tipo','Dettagli','Prezzo (€)',''].map(h => <th key={h} style={{ textAlign:'left', padding:'6px 10px', color:'var(--text-secondary)', fontWeight:600, fontSize:11, textTransform:'uppercase' }}>{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {assicurazioni.map(a => {
                const d = editAss[a.id] || {}
                return (
                  <tr key={a.id} style={{ borderBottom:'1px solid var(--border)' }}>
                    <td style={{ padding:'8px 10px', width:130 }}>{inlineInput(d.tipo ?? a.tipo, v => setEditAss(p => ({ ...p, [a.id]:{ ...p[a.id], tipo:v } })))}</td>
                    <td style={{ padding:'8px 10px' }}>{inlineInput(d.dettagli ?? a.dettagli, v => setEditAss(p => ({ ...p, [a.id]:{ ...p[a.id], dettagli:v } })))}</td>
                    <td style={{ padding:'8px 10px', width:120 }}>{inlineInput(String(d.prezzo ?? a.prezzo), v => setEditAss(p => ({ ...p, [a.id]:{ ...p[a.id], prezzo:parseFloat(v) } })), 'number')}</td>
                    <td style={{ padding:'8px 10px', width:120 }}>
                      <div style={{ display:'flex', gap:6 }}>
                        <Btn small onClick={() => saveAss(a.id)}>Salva</Btn>
                        <Btn small variant="danger" onClick={() => deleteAss(a.id)}>✕</Btn>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </Card>
      </section>

      {/* ── MODAL: nuovo negozio ── */}
      {showAddLoc && (
        <Modal title="Nuovo Punto Vendita" onClose={() => setShowAddLoc(false)}>
          <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
            <Field label="Nome negozio"><Inp value={newLoc.nome} onChange={v => setNewLoc(p => ({ ...p, nome:v }))} placeholder="es. BikeRent Centro" /></Field>
            <Field label="Indirizzo"><Inp value={newLoc.indirizzo} onChange={v => setNewLoc(p => ({ ...p, indirizzo:v }))} placeholder="Via Roma 1, Milano" /></Field>
            <Field label="Prezzo mezza giornata (€)"><Inp type="number" value={newLoc.prezzoMezzaGiornata} onChange={v => setNewLoc(p => ({ ...p, prezzoMezzaGiornata:v }))} placeholder="0.00" min="0" /></Field>
            <div style={{ display:'flex', gap:10, justifyContent:'flex-end', marginTop:8 }}>
              <Btn variant="ghost" onClick={() => setShowAddLoc(false)}>Annulla</Btn>
              <Btn onClick={createLoc} disabled={savingLoc}>{savingLoc ? 'Creazione…' : 'Crea negozio'}</Btn>
            </div>
          </div>
        </Modal>
      )}

      {/* ── MODAL: nuovo accessorio ── */}
      {showAddAcc && (
        <Modal title="Nuovo Accessorio" onClose={() => setShowAddAcc(false)}>
          <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
            <Field label="Nome"><Inp value={newAcc.nome} onChange={v => setNewAcc(p => ({ ...p, nome:v }))} placeholder="es. Casco, Lucchetto…" /></Field>
            <Field label="Prezzo (€)"><Inp type="number" value={newAcc.prezzo} onChange={v => setNewAcc(p => ({ ...p, prezzo:v }))} placeholder="0.00" min="0" /></Field>
            <div style={{ display:'flex', gap:10, justifyContent:'flex-end', marginTop:8 }}>
              <Btn variant="ghost" onClick={() => setShowAddAcc(false)}>Annulla</Btn>
              <Btn onClick={createAcc} disabled={savingAcc}>{savingAcc ? 'Creazione…' : 'Crea accessorio'}</Btn>
            </div>
          </div>
        </Modal>
      )}

      {/* ── MODAL: nuova assicurazione ── */}
      {showAddAss && (
        <Modal title="Nuova Assicurazione" onClose={() => setShowAddAss(false)}>
          <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
            <Field label="Tipo"><Inp value={newAss.tipo} onChange={v => setNewAss(p => ({ ...p, tipo:v }))} placeholder="es. Kasko, Base…" /></Field>
            <Field label="Dettagli"><Inp value={newAss.dettagli} onChange={v => setNewAss(p => ({ ...p, dettagli:v }))} placeholder="Descrizione copertura" /></Field>
            <Field label="Prezzo (€)"><Inp type="number" value={newAss.prezzo} onChange={v => setNewAss(p => ({ ...p, prezzo:v }))} placeholder="0.00" min="0" /></Field>
            <div style={{ display:'flex', gap:10, justifyContent:'flex-end', marginTop:8 }}>
              <Btn variant="ghost" onClick={() => setShowAddAss(false)}>Annulla</Btn>
              <Btn onClick={createAss} disabled={savingAss}>{savingAss ? 'Creazione…' : 'Crea assicurazione'}</Btn>
            </div>
          </div>
        </Modal>
      )}
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
  const [filtData,   setFiltData]   = useState('')
  const [filtLocation, setFiltLocation] = useState('')
  const [modalPren, setModalPren] = useState<Prenotazione | null>(null)
  const [nuovoStato, setNuovoStato] = useState<StatoPrenotazione>('PENDING')
  const [note, setNote] = useState('')
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ action:'prenotazioni' })
      if (filtUtente)   params.set('utente', filtUtente)
      if (filtData)     params.set('data', filtData)
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
      await api.post(API, { action:'update_stato_prenotazione', prenotazioneId:modalPren.id, stato:nuovoStato, noteProblemi:note||undefined })
      onSuccess(`Stato aggiornato: ${statoLabel[nuovoStato]}`)
      setModalPren(null); load()
    } catch (e: any) { onError(e.message) }
    finally { setSaving(false) }
  }

  const openModal = (p: Prenotazione) => { setModalPren(p); setNuovoStato(p.stato); setNote(p.noteProblemi||'') }

  return (
    <div>
      <Card style={{ marginBottom:20 }}>
        <div style={{ display:'flex', gap:12, flexWrap:'wrap', alignItems:'flex-end' }}>
          <div style={{ flex:1, minWidth:160 }}>
            <Field label="Utente"><Inp value={filtUtente} onChange={setFiltUtente} placeholder="Nome o cognome" /></Field>
          </div>
          <div style={{ flex:1, minWidth:140 }}>
            <Field label="Data ritiro"><Inp type="date" value={filtData} onChange={setFiltData} /></Field>
          </div>
          <div style={{ flex:1, minWidth:160 }}>
            <Field label="Negozio">
              <Sel value={filtLocation} onChange={setFiltLocation}>
                <option value="">Tutti</option>
                {negozi.map(n => <option key={n.id} value={n.id}>{n.nome}</option>)}
              </Sel>
            </Field>
          </div>
          <Btn onClick={load}>Cerca</Btn>
          <Btn variant="ghost" onClick={() => { setFiltUtente(''); setFiltData(''); setFiltLocation('') }}>Reset</Btn>
        </div>
      </Card>

      {loading ? (
        <div style={{ textAlign:'center', padding:40, color:'var(--text-secondary)', fontFamily:'var(--font-body)' }}>Caricamento…</div>
      ) : (
        <Card style={{ padding:0, overflow:'hidden' }}>
          <div style={{ overflowX:'auto' }}>
            <table style={{ width:'100%', borderCollapse:'collapse', fontFamily:'var(--font-body)', fontSize:13 }}>
              <thead>
                <tr style={{ background:'var(--table-head)' }}>
                  {['#','Utente','Bici','Negozio','Ritiro','Restituzione','Totale','Stato',''].map(h => (
                    <th key={h} style={{ textAlign:'left', padding:'12px 16px', color:'var(--text-secondary)', fontWeight:600, fontSize:11, textTransform:'uppercase', whiteSpace:'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {prenotazioni.length === 0 ? (
                  <tr><td colSpan={9} style={{ textAlign:'center', padding:40, color:'var(--text-secondary)' }}>Nessuna prenotazione trovata</td></tr>
                ) : prenotazioni.map((p, i) => (
                  <tr key={p.id} style={{ borderBottom:'1px solid var(--border)', background: i%2===0 ? 'transparent' : 'var(--row-alt)' }}>
                    <td style={{ padding:'12px 16px', color:'var(--text-secondary)', fontSize:11 }}>#{p.id}</td>
                    <td style={{ padding:'12px 16px' }}>
                      <div style={{ fontWeight:600, color:'var(--text-primary)' }}>{p.utente.firstName} {p.utente.lastName}</div>
                      <div style={{ fontSize:11, color:'var(--text-secondary)' }}>{p.utente.email}</div>
                    </td>
                    <td style={{ padding:'12px 16px', color:'var(--text-primary)' }}>{p.bicicletta.modello.nome}</td>
                    <td style={{ padding:'12px 16px', color:'var(--text-primary)' }}>{p.location.nome}</td>
                    <td style={{ padding:'12px 16px', color:'var(--text-primary)', whiteSpace:'nowrap' }}>{fmtDate(p.dataRitiro)}</td>
                    <td style={{ padding:'12px 16px', color:'var(--text-primary)', whiteSpace:'nowrap' }}>{fmtDate(p.dataOreConsegna)}</td>
                    <td style={{ padding:'12px 16px', fontWeight:600, color:'var(--accent)' }}>{fmt(p.totalePagato)}</td>
                    <td style={{ padding:'12px 16px' }}>
                      <span style={{ background:statoColor[p.stato]+'22', color:statoColor[p.stato], borderRadius:6, padding:'3px 9px', fontSize:11, fontWeight:700 }}>
                        {statoLabel[p.stato]}
                      </span>
                    </td>
                    <td style={{ padding:'12px 16px' }}><Btn onClick={() => openModal(p)} small variant="ghost">Gestisci</Btn></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {modalPren && (
        <Modal title={`Prenotazione #${modalPren.id}`}
          subtitle={`${modalPren.utente.firstName} ${modalPren.utente.lastName} — ${modalPren.bicicletta.modello.nome}`}
          onClose={() => setModalPren(null)}>
          <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
            <Field label="Nuovo stato">
              <Sel value={nuovoStato} onChange={v => setNuovoStato(v as StatoPrenotazione)}>
                {(Object.keys(statoLabel) as StatoPrenotazione[]).map(s => <option key={s} value={s}>{statoLabel[s]}</option>)}
              </Sel>
            </Field>
            {(nuovoStato === 'DAMAGED' || nuovoStato === 'LATE') && (
              <Field label="Note problema">
                <textarea value={note} onChange={e => setNote(e.target.value)} rows={3}
                  placeholder="Descrivi il danno o il ritardo…"
                  style={{ background:'var(--input-bg)', border:'1px solid var(--border)', borderRadius:8,
                    padding:'8px 12px', color:'var(--text-primary)', fontFamily:'var(--font-body)', fontSize:13, resize:'vertical' }} />
              </Field>
            )}
            <div style={{ display:'flex', gap:10, justifyContent:'flex-end', marginTop:6 }}>
              <Btn variant="ghost" onClick={() => setModalPren(null)}>Annulla</Btn>
              <Btn onClick={aggiornaStato} disabled={saving}>{saving ? 'Salvataggio…' : 'Conferma'}</Btn>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}

// ─── Tab: Stock ───────────────────────────────────────────────────────────────

// Modale: crea nuova bicicletta nel catalogo
function ModalCreaBici({ catalogo, onClose, onSuccess, onError }: {
  catalogo: Catalogo; onClose: () => void
  onSuccess: (m: string) => void; onError: (m: string) => void
}) {
  const [modelloMode, setModelloMode] = useState<'existing'|'new'>('existing')
  const [modelloId, setModelloId] = useState('')
  const [nomeModello, setNomeModello] = useState('')
  const [tipologieSelezionate, setTipologieSelezionate] = useState<number[]>([])
  const [dimensioni, setDimensioni] = useState<{ taglia:string; quantitaElettrico:number; quantitaMuscolare:number }[]>(
    TAGLIE_ORDER.map(t => ({ taglia:t, quantitaElettrico:0, quantitaMuscolare:0 }))
  )
  const [saving, setSaving] = useState(false)

  const toggleTipologia = (id: number) =>
    setTipologieSelezionate(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id])

  const updateDim = (taglia: string, field: 'quantitaElettrico'|'quantitaMuscolare', val: number) =>
    setDimensioni(p => p.map(d => d.taglia === taglia ? { ...d, [field]:val } : d))

  const submit = async () => {
    if (tipologieSelezionate.length === 0) return onError('Seleziona almeno una tipologia')
    const dimAttive = dimensioni.filter(d => d.quantitaElettrico > 0 || d.quantitaMuscolare > 0)
    if (dimAttive.length === 0) return onError('Inserisci almeno una quantità per una taglia')
    setSaving(true)
    try {
      await api.post(API, {
        action: 'create_bicicletta',
        modelloId:    modelloMode === 'existing' && modelloId ? parseInt(modelloId) : undefined,
        nomeModello:  modelloMode === 'new' ? nomeModello : undefined,
        tipologieIds: tipologieSelezionate,
        dimensioni:   dimAttive
      })
      onSuccess('Bicicletta creata nel catalogo'); onClose()
    } catch (e: any) { onError(e.message) }
    finally { setSaving(false) }
  }

  return (
    <Modal title="Nuova Bicicletta" subtitle="Aggiungi un modello al catalogo globale" onClose={onClose} maxWidth={560}>
      <div style={{ display:'flex', flexDirection:'column', gap:18 }}>

        {/* Modello */}
        <div>
          <div style={{ fontSize:11, fontWeight:600, color:'var(--text-secondary)', textTransform:'uppercase', letterSpacing:'0.05em', marginBottom:8 }}>Modello</div>
          <div style={{ display:'flex', gap:8, marginBottom:10 }}>
            {(['existing','new'] as const).map(m => (
              <button key={m} onClick={() => setModelloMode(m)}
                style={{ padding:'6px 14px', borderRadius:7, border:'1px solid var(--border)', cursor:'pointer',
                  background: modelloMode===m ? 'var(--accent)' : 'var(--input-bg)',
                  color: modelloMode===m ? '#fff' : 'var(--text-secondary)',
                  fontFamily:'var(--font-body)', fontSize:12, fontWeight:600 }}>
                {m==='existing' ? 'Modello esistente' : 'Nuovo modello'}
              </button>
            ))}
          </div>
          {modelloMode === 'existing' ? (
            <Field label="Seleziona modello">
              <Sel value={modelloId} onChange={setModelloId}>
                <option value="">— scegli —</option>
                {catalogo.modelli.map(m => <option key={m.id} value={m.id}>{m.nome}</option>)}
              </Sel>
            </Field>
          ) : (
            <Field label="Nome nuovo modello"><Inp value={nomeModello} onChange={setNomeModello} placeholder="es. CityRider Pro" /></Field>
          )}
        </div>

        {/* Tipologie */}
        <div>
          <div style={{ fontSize:11, fontWeight:600, color:'var(--text-secondary)', textTransform:'uppercase', letterSpacing:'0.05em', marginBottom:8 }}>
            Tipologie <span style={{ color:'var(--accent)' }}>*</span>
          </div>
          <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
            {catalogo.tipologie.map(t => {
              const sel = tipologieSelezionate.includes(t.id)
              const elettr = isElettr(t.nome)
              return (
                <button key={t.id} onClick={() => toggleTipologia(t.id)}
                  style={{ padding:'6px 14px', borderRadius:7, cursor:'pointer',
                    border: sel ? `1.5px solid ${elettr ? '#60a5fa' : '#a78bfa'}` : '1px solid var(--border)',
                    background: sel ? (elettr ? '#3b82f622' : '#8b5cf622') : 'var(--input-bg)',
                    color: sel ? (elettr ? '#60a5fa' : '#a78bfa') : 'var(--text-secondary)',
                    fontFamily:'var(--font-body)', fontSize:12, fontWeight:600 }}>
                  {t.nome}
                </button>
              )
            })}
          </div>
        </div>

        {/* Dimensioni / quantità per taglia */}
        <div>
          <div style={{ fontSize:11, fontWeight:600, color:'var(--text-secondary)', textTransform:'uppercase', letterSpacing:'0.05em', marginBottom:8 }}>
            Quantità per taglia <span style={{ fontWeight:400, color:'var(--text-secondary)', textTransform:'none', fontSize:11 }}>(lascia 0 per non includere)</span>
          </div>
          <div style={{ overflowX:'auto' }}>
            <table style={{ width:'100%', borderCollapse:'collapse', fontFamily:'var(--font-body)', fontSize:13 }}>
              <thead>
                <tr style={{ borderBottom:'1px solid var(--border)' }}>
                  <th style={{ textAlign:'left', padding:'6px 10px', color:'var(--text-secondary)', fontWeight:600, fontSize:11 }}>Taglia</th>
                  <th style={{ textAlign:'center', padding:'6px 10px', color:'#60a5fa', fontWeight:600, fontSize:11 }}>⚡ Elettriche</th>
                  <th style={{ textAlign:'center', padding:'6px 10px', color:'#a78bfa', fontWeight:600, fontSize:11 }}>💪 Muscolari</th>
                </tr>
              </thead>
              <tbody>
                {dimensioni.map(d => (
                  <tr key={d.taglia} style={{ borderBottom:'1px solid var(--border)' }}>
                    <td style={{ padding:'6px 10px' }}>
                      <span style={{ background:'var(--card-bg)', border:'1px solid var(--border)', borderRadius:5,
                        padding:'2px 10px', fontWeight:700, fontSize:12, color:'var(--text-primary)' }}>{d.taglia}</span>
                    </td>
                    <td style={{ padding:'6px 10px' }}>
                      <input type="number" min="0" value={d.quantitaElettrico}
                        onChange={e => updateDim(d.taglia, 'quantitaElettrico', parseInt(e.target.value)||0)}
                        style={{ background:'var(--input-bg)', border:'1px solid var(--border)', borderRadius:6,
                          padding:'5px 8px', color:'#60a5fa', fontFamily:'var(--font-body)', fontSize:13,
                          width:70, textAlign:'center' }} />
                    </td>
                    <td style={{ padding:'6px 10px' }}>
                      <input type="number" min="0" value={d.quantitaMuscolare}
                        onChange={e => updateDim(d.taglia, 'quantitaMuscolare', parseInt(e.target.value)||0)}
                        style={{ background:'var(--input-bg)', border:'1px solid var(--border)', borderRadius:6,
                          padding:'5px 8px', color:'#a78bfa', fontFamily:'var(--font-body)', fontSize:13,
                          width:70, textAlign:'center' }} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div style={{ display:'flex', gap:10, justifyContent:'flex-end', marginTop:4 }}>
          <Btn variant="ghost" onClick={onClose}>Annulla</Btn>
          <Btn onClick={submit} disabled={saving}>{saving ? 'Creazione…' : 'Crea bicicletta'}</Btn>
        </div>
      </div>
    </Modal>
  )
}

// Modale: aggiungi bici esistente a negozio
function ModalAggiungiBici({ negozio, catalogo, onClose, onSuccess, onError }: {
  negozio: Location; catalogo: Catalogo; onClose: () => void
  onSuccess: (m: string) => void; onError: (m: string) => void
}) {
  const [addBiciId, setAddBiciId] = useState('')
  const [addQty, setAddQty]       = useState('1')
  const [saving, setSaving]       = useState(false)
  const biciInNegozio             = new Set(negozio.stocks.map(s => s.biciclettaId))

  const submit = async () => {
    if (!addBiciId) return onError('Seleziona un modello')
    setSaving(true)
    try {
      await api.post(API, { action:'aggiungi_bici_negozio', locationId:negozio.id, biciclettaId:parseInt(addBiciId), quantita:parseInt(addQty)||1 })
      onSuccess('Bicicletta aggiunta allo stock'); onClose()
    } catch (e: any) { onError(e.message) }
    finally { setSaving(false) }
  }

  return (
    <Modal title={`Aggiungi bici a ${negozio.nome}`} subtitle="Seleziona un modello dal catalogo e la quantità." onClose={onClose} maxWidth={520}>
      <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
        <div style={{ maxHeight:340, overflowY:'auto', display:'flex', flexDirection:'column', gap:6 }}>
          {catalogo.biciclette.map(b => {
            const sel     = addBiciId === String(b.id)
            const presente = biciInNegozio.has(b.id)
            return (
              <button key={b.id} onClick={() => setAddBiciId(String(b.id))}
                style={{ display:'flex', alignItems:'center', justifyContent:'space-between',
                  padding:'10px 14px', borderRadius:9, cursor:'pointer', textAlign:'left',
                  border: sel ? '1.5px solid var(--accent)' : '1px solid var(--border)',
                  background: sel ? 'rgba(79,125,255,0.1)' : 'var(--input-bg)',
                  fontFamily:'var(--font-body)', transition:'all 0.12s' }}>
                <div>
                  <div style={{ fontWeight:700, color:'var(--text-primary)', fontSize:14 }}>{b.modello.nome}</div>
                  <div style={{ display:'flex', gap:5, marginTop:4, flexWrap:'wrap' }}>
                    {b.tipologie.map(t => (
                      <span key={t.id} style={{ background: isElettr(t.nome) ? '#3b82f622' : '#8b5cf622',
                        color: isElettr(t.nome) ? '#60a5fa' : '#a78bfa',
                        borderRadius:4, padding:'1px 6px', fontSize:10, fontWeight:600 }}>{t.nome}</span>
                    ))}
                    {b.dimensioni.filter(d => d.quantitaElettrico+d.quantitaMuscolare > 0).map(d => (
                      <span key={d.id} style={{ background:'var(--card-bg)', border:'1px solid var(--border)',
                        borderRadius:4, padding:'1px 6px', fontSize:10, color:'var(--text-secondary)', fontWeight:600 }}>{d.taglia}</span>
                    ))}
                  </div>
                </div>
                {presente && (
                  <span style={{ fontSize:10, fontWeight:600, color:'#10b981', background:'#10b98120',
                    border:'1px solid #10b98140', borderRadius:4, padding:'2px 7px', whiteSpace:'nowrap' }}>Già in stock</span>
                )}
              </button>
            )
          })}
        </div>
        <Field label="Quantità da aggiungere"><Inp type="number" value={addQty} onChange={setAddQty} placeholder="1" min="1" /></Field>
        <div style={{ display:'flex', gap:10, justifyContent:'flex-end', marginTop:4 }}>
          <Btn variant="ghost" onClick={onClose}>Annulla</Btn>
          <Btn onClick={submit} disabled={saving || !addBiciId}>{saving ? 'Aggiunta…' : 'Aggiungi allo stock'}</Btn>
        </div>
      </div>
    </Modal>
  )
}

function TabStock({ negozi, onSuccess, onError, reload }: {
  negozi: Location[]; onSuccess: (m: string) => void; onError: (m: string) => void; reload: () => void
}) {
  const [selNegozio, setSelNegozio]   = useState<number | null>(negozi[0]?.id ?? null)
  const [loading, setLoading]         = useState(false)
  const [expandedStock, setExpanded]  = useState<number | null>(null)
  const [catalogo, setCatalogo]       = useState<Catalogo | null>(null)
  const [showAddModal, setShowAdd]    = useState(false)
  const [showCreaModal, setShowCrea]  = useState(false)

  const negozio = negozi.find(n => n.id === selNegozio)

  const loadCatalogo = async () => {
    if (catalogo) return
    try {
      const { data } = await api.get(`${API}?action=catalogo`)
      setCatalogo(data)
    } catch (e: any) { onError(e.message) }
  }

  const openAddModal = async () => { await loadCatalogo(); setShowAdd(true) }
  const openCreaModal = async () => { await loadCatalogo(); setShowCrea(true) }

  const stockAction = async (locationId: number, biciclettaId: number, azione_stock: string) => {
    setLoading(true)
    try {
      await api.post(API, { action:'update_stock', locationId, biciclettaId, azione_stock })
      onSuccess('Stock aggiornato'); reload()
    } catch (e: any) { onError(e.message) }
    finally { setLoading(false) }
  }

  return (
    <div>
      {/* Selezione negozio + azioni globali */}
      <div style={{ display:'flex', gap:10, marginBottom:24, flexWrap:'wrap', alignItems:'center' }}>
        <div style={{ display:'flex', gap:8, flexWrap:'wrap', flex:1 }}>
          {negozi.map(n => (
            <button key={n.id} onClick={() => setSelNegozio(n.id)}
              style={{ padding:'8px 18px', borderRadius:8, border:'1px solid var(--border)',
                background: selNegozio===n.id ? 'var(--accent)' : 'var(--card-bg)',
                color: selNegozio===n.id ? '#fff' : 'var(--text-primary)',
                fontFamily:'var(--font-body)', fontSize:13, fontWeight:600, cursor:'pointer', transition:'all 0.15s' }}>
              {n.nome}
            </button>
          ))}
        </div>
        <div style={{ display:'flex', gap:8 }}>
          <Btn small variant="ghost" onClick={openCreaModal}>＋ Nuova bici (catalogo)</Btn>
          {negozio && <Btn small onClick={openAddModal}>＋ Aggiungi a {negozio.nome}</Btn>}
        </div>
      </div>

      {negozio && (
        <>
          <SectionTitle>{negozio.nome} — Inventario</SectionTitle>
          {negozio.stocks.length === 0 ? (
            <Card>
              <div style={{ color:'var(--text-secondary)', fontFamily:'var(--font-body)', fontSize:14, textAlign:'center', padding:'12px 0' }}>
                Nessun modello in stock. Usa "Aggiungi" per aggiungere modelli all'inventario.
              </div>
            </Card>
          ) : (
            <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
              {negozio.stocks.map(s => {
                const disponibili = s.quantita - s.inManutenzione
                const isExp       = expandedStock === s.id
                const { tipologie, dimensioni } = s.bicicletta

                return (
                  <Card key={s.id} style={{ padding:0, overflow:'hidden' }}>
                    {/* Header */}
                    <div style={{ padding:'16px 20px', display:'flex', gap:16, alignItems:'center', flexWrap:'wrap' }}>
                      {/* Nome + badge tipologie */}
                      <div style={{ flex:1, minWidth:160 }}>
                        <div style={{ fontFamily:'var(--font-display)', fontWeight:700, fontSize:15, color:'var(--text-primary)', marginBottom:6 }}>
                          {s.bicicletta.modello.nome}
                        </div>
                        <div style={{ display:'flex', gap:5, flexWrap:'wrap' }}>
                          {tipologie.map(t => (
                            <span key={t.id} style={{
                              background: isElettr(t.nome) ? '#3b82f622' : '#8b5cf622',
                              color:      isElettr(t.nome) ? '#60a5fa'   : '#a78bfa',
                              border:    `1px solid ${isElettr(t.nome) ? '#3b82f640' : '#8b5cf640'}`,
                              borderRadius:5, padding:'2px 8px', fontSize:11, fontWeight:600, fontFamily:'var(--font-body)'
                            }}>{t.nome}</span>
                          ))}
                        </div>
                      </div>

                      {/* Counters */}
                      <div style={{ display:'flex', gap:20 }}>
                        {[
                          { label:'Totale',     value:s.quantita,       color:'var(--accent)' },
                          { label:'Disponibili',value:disponibili,      color:'#10b981' },
                          { label:'In officina',value:s.inManutenzione, color:'#f59e0b' },
                        ].map(c => (
                          <div key={c.label} style={{ textAlign:'center' }}>
                            <div style={{ fontSize:24, fontWeight:800, color:c.color, fontFamily:'var(--font-display)' }}>{c.value}</div>
                            <div style={{ fontSize:10, color:'var(--text-secondary)', textTransform:'uppercase', letterSpacing:'0.05em' }}>{c.label}</div>
                          </div>
                        ))}
                      </div>

                      {/* Azioni stock */}
                      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:6, minWidth:230 }}>
                        <Btn small onClick={() => stockAction(negozio.id, s.biciclettaId, 'incrementa')} disabled={loading}>＋ Aggiungi</Btn>
                        <Btn small variant="ghost" onClick={() => stockAction(negozio.id, s.biciclettaId, 'riduce')} disabled={loading}>－ Rimuovi</Btn>
                        <Btn small variant="danger" onClick={() => stockAction(negozio.id, s.biciclettaId, 'manutenzione_in')} disabled={loading}>🔧 In officina</Btn>
                        <Btn small variant="success" onClick={() => stockAction(negozio.id, s.biciclettaId, 'manutenzione_out')} disabled={loading}>✓ Da officina</Btn>
                      </div>

                      {/* Toggle taglie */}
                      {dimensioni.length > 0 && (
                        <button onClick={() => setExpanded(isExp ? null : s.id)}
                          style={{ background:'var(--input-bg)', border:'1px solid var(--border)', borderRadius:8,
                            padding:'6px 14px', color:'var(--text-secondary)', fontFamily:'var(--font-body)',
                            fontSize:12, fontWeight:600, cursor:'pointer', whiteSpace:'nowrap' }}>
                          {isExp ? '▲ Nascondi taglie' : '▼ Vedi taglie'}
                        </button>
                      )}
                    </div>

                    {/* Taglie espandibili */}
                    {isExp && dimensioni.length > 0 && (
                      <div style={{ borderTop:'1px solid var(--border)', background:'var(--table-head)', padding:'12px 20px' }}>
                        <div style={{ fontSize:11, fontWeight:600, color:'var(--text-secondary)', textTransform:'uppercase', marginBottom:10 }}>Dettaglio taglie</div>
                        <table style={{ width:'100%', borderCollapse:'collapse', fontFamily:'var(--font-body)', fontSize:13 }}>
                          <thead>
                            <tr>
                              {['Taglia','⚡ Elettriche','💪 Muscolari','Totale'].map((h,i) => (
                                <th key={h} style={{ textAlign: i===0?'left':'center', padding:'6px 12px',
                                  color: i===1?'#60a5fa':i===2?'#a78bfa':'var(--text-secondary)',
                                  fontWeight:600, fontSize:11, textTransform:'uppercase' }}>{h}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {[...dimensioni].sort((a,b) => TAGLIE_ORDER.indexOf(a.taglia) - TAGLIE_ORDER.indexOf(b.taglia)).map(dim => (
                              <tr key={dim.id} style={{ borderTop:'1px solid var(--border)' }}>
                                <td style={{ padding:'8px 12px' }}>
                                  <span style={{ background:'var(--card-bg)', border:'1px solid var(--border)',
                                    borderRadius:5, padding:'2px 10px', fontWeight:700, fontSize:12, color:'var(--text-primary)' }}>{dim.taglia}</span>
                                </td>
                                <td style={{ padding:'8px 12px', textAlign:'center', fontSize:16, fontWeight:700, color:'#60a5fa' }}>{dim.quantitaElettrico}</td>
                                <td style={{ padding:'8px 12px', textAlign:'center', fontSize:16, fontWeight:700, color:'#a78bfa' }}>{dim.quantitaMuscolare}</td>
                                <td style={{ padding:'8px 12px', textAlign:'center', fontSize:16, fontWeight:700, color:'var(--text-primary)' }}>{dim.quantitaElettrico+dim.quantitaMuscolare}</td>
                              </tr>
                            ))}
                            <tr style={{ borderTop:'2px solid var(--border)', background:'rgba(79,125,255,0.05)' }}>
                              <td style={{ padding:'8px 12px', fontWeight:700, color:'var(--text-secondary)', fontSize:11, textTransform:'uppercase' }}>Totale</td>
                              <td style={{ padding:'8px 12px', textAlign:'center', fontWeight:800, color:'#60a5fa' }}>{dimensioni.reduce((a,d)=>a+d.quantitaElettrico,0)}</td>
                              <td style={{ padding:'8px 12px', textAlign:'center', fontWeight:800, color:'#a78bfa' }}>{dimensioni.reduce((a,d)=>a+d.quantitaMuscolare,0)}</td>
                              <td style={{ padding:'8px 12px', textAlign:'center', fontWeight:800, color:'var(--accent)' }}>{dimensioni.reduce((a,d)=>a+d.quantitaElettrico+d.quantitaMuscolare,0)}</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    )}
                  </Card>
                )
              })}
            </div>
          )}
        </>
      )}

      {/* Modali */}
      {showCreaModal && catalogo && (
        <ModalCreaBici catalogo={catalogo} onClose={() => { setShowCrea(false); reload() }}
          onSuccess={m => { onSuccess(m); setCatalogo(null) }} onError={onError} />
      )}
      {showAddModal && catalogo && negozio && (
        <ModalAggiungiBici negozio={negozio} catalogo={catalogo}
          onClose={() => { setShowAdd(false); reload() }}
          onSuccess={onSuccess} onError={onError} />
      )}
    </div>
  )
}

// ─── Tab: Statistiche ─────────────────────────────────────────────────────────

function TabStatistiche({ onError }: { onError: (m: string) => void }) {
  const [stats, setStats] = useState<Statistiche | null>(null)
  const [loading, setLoading] = useState(false)
  const [da, setDa] = useState('')
  const [a, setA]   = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ action:'statistiche' })
      if (da) params.set('da', da)
      if (a)  params.set('a', a)
      const { data } = await api.get(`${API}?${params}`)
      setStats(data)
    } catch (e: any) { onError(e.message) }
    finally { setLoading(false) }
  }, [da, a, onError])

  useEffect(() => { load() }, [])

  const maxRev  = stats ? Math.max(...stats.shopPerformance.map(s => s.revenue), 1) : 1
  const maxRent = stats ? Math.max(...stats.mostUsedBikes.map(b => b.rentals), 1) : 1

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:28 }}>
      <Card>
        <div style={{ display:'flex', gap:12, flexWrap:'wrap', alignItems:'flex-end' }}>
          <div style={{ flex:1, minWidth:140 }}><Field label="Dal"><Inp type="date" value={da} onChange={setDa} /></Field></div>
          <div style={{ flex:1, minWidth:140 }}><Field label="Al"><Inp type="date" value={a} onChange={setA} /></Field></div>
          <Btn onClick={load}>Aggiorna</Btn>
          <Btn variant="ghost" onClick={() => { setDa(''); setA('') }}>Tutto lo storico</Btn>
        </div>
      </Card>

      {loading ? (
        <div style={{ textAlign:'center', padding:60, color:'var(--text-secondary)', fontFamily:'var(--font-body)' }}>Caricamento statistiche…</div>
      ) : stats ? (
        <>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(180px, 1fr))', gap:16 }}>
            {[
              { label:'Prenotazioni totali', value:stats.totalBookings.toLocaleString('it-IT'), color:'#3b82f6' },
              { label:'Ricavi totali',       value:fmt(stats.totalRevenue),                    color:'#10b981' },
              { label:'Negozi attivi',       value:stats.shopPerformance.length,               color:'#f59e0b' },
              { label:'Modelli top',         value:stats.mostUsedBikes.length,                 color:'#8b5cf6' },
            ].map(k => (
              <Card key={k.label} style={{ textAlign:'center' }}>
                <div style={{ fontSize:28, fontWeight:800, color:k.color, fontFamily:'var(--font-display)' }}>{k.value}</div>
                <div style={{ fontSize:12, color:'var(--text-secondary)', marginTop:4, fontFamily:'var(--font-body)', textTransform:'uppercase', letterSpacing:'0.05em' }}>{k.label}</div>
              </Card>
            ))}
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(340px, 1fr))', gap:20 }}>
            <Card>
              <SectionTitle>Performance Negozi</SectionTitle>
              <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
                {[...stats.shopPerformance].sort((a,b) => b.revenue-a.revenue).map(s => (
                  <div key={s.name}>
                    <div style={{ display:'flex', justifyContent:'space-between', marginBottom:5 }}>
                      <span style={{ fontFamily:'var(--font-body)', fontSize:13, color:'var(--text-primary)', fontWeight:600 }}>{s.name}</span>
                      <span style={{ fontFamily:'var(--font-body)', fontSize:13, color:'var(--accent)', fontWeight:700 }}>{fmt(s.revenue)}</span>
                    </div>
                    <div style={{ height:6, background:'var(--border)', borderRadius:99 }}>
                      <div style={{ height:6, borderRadius:99, background:'var(--accent)', width:`${(s.revenue/maxRev)*100}%`, transition:'width 0.4s ease' }} />
                    </div>
                  </div>
                ))}
              </div>
            </Card>
            <Card>
              <SectionTitle>Bici Più Usate</SectionTitle>
              <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
                {stats.mostUsedBikes.map((b,i) => (
                  <div key={b.model}>
                    <div style={{ display:'flex', justifyContent:'space-between', marginBottom:5 }}>
                      <div style={{ display:'flex', gap:8, alignItems:'center' }}>
                        <span style={{ fontFamily:'var(--font-display)', fontSize:11, fontWeight:800, color:'#fff',
                          background:(['#f59e0b','#94a3b8','#cd7c3c','#6b7280','#6b7280'][i]??'#6b7280'),
                          borderRadius:4, padding:'1px 6px' }}>#{i+1}</span>
                        <span style={{ fontFamily:'var(--font-body)', fontSize:13, color:'var(--text-primary)', fontWeight:600 }}>{b.model}</span>
                      </div>
                      <span style={{ fontFamily:'var(--font-body)', fontSize:13, color:'var(--text-secondary)', fontWeight:600 }}>{b.rentals} noleggi</span>
                    </div>
                    <div style={{ height:6, background:'var(--border)', borderRadius:99 }}>
                      <div style={{ height:6, borderRadius:99, background:'#8b5cf6', width:`${(b.rentals/maxRent)*100}%`, transition:'width 0.4s ease' }} />
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

// ─── Page root ────────────────────────────────────────────────────────────────

const tabs: { id: Tab; label: string; icon: string }[] = [
  { id:'config',       label:'Configurazione', icon:'⚙️' },
  { id:'prenotazioni', label:'Prenotazioni',   icon:'📋' },
  { id:'stock',        label:'Stock',          icon:'🚲' },
  { id:'statistiche',  label:'Statistiche',    icon:'📊' },
]

export default function BackofficePage() {
  const [activeTab, setActiveTab]   = useState<Tab>('prenotazioni')
  const [config, setConfig]         = useState<{ negozi: Location[]; accessori: Accessorio[]; assicurazioni: Assicurazione[] } | null>(null)
  const [loadingConfig, setLoading] = useState(true)
  const [toast, setToast]           = useState<{ msg: string; type: 'ok'|'err' } | null>(null)

  const loadConfig = useCallback(async () => {
    setLoading(true)
    try {
      const { data } = await api.get(`${API}?action=config`)
      setConfig(data)
    } catch (e: any) {
      setToast({ msg: e.message, type: 'err' })
    } finally { setLoading(false) }
  }, [])

  useEffect(() => { loadConfig() }, [loadConfig])

  const onSuccess = (msg: string) => setToast({ msg, type:'ok' })
  const onError   = (msg: string) => setToast({ msg, type:'err' })

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@400;500;600&display=swap');
        :root {
          --font-display: 'Syne', sans-serif;
          --font-body: 'DM Sans', sans-serif;
          --bg: #0f1117; --sidebar-bg: #161923; --card-bg: #1c2130;
          --table-head: #1a1f2e; --row-alt: #181d2a; --border: #2a3148;
          --text-primary: #e8ecf4; --text-secondary: #7a8aab;
          --accent: #4f7dff; --input-bg: #131720;
        }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: var(--bg); }
        @keyframes slideUp { from { transform: translateY(12px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        input:focus, select:focus, textarea:focus { border-color: var(--accent) !important; outline: none; }
        ::-webkit-scrollbar { width: 5px; height: 5px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: var(--border); border-radius: 99px; }
      `}</style>

      <div style={{ display:'flex', minHeight:'100vh', fontFamily:'var(--font-body)' }}>
        {/* Sidebar */}
        <aside style={{ width:220, background:'var(--sidebar-bg)', borderRight:'1px solid var(--border)',
          display:'flex', flexDirection:'column', padding:'28px 0', flexShrink:0, position:'sticky', top:0, height:'100vh' }}>
          <div style={{ padding:'0 22px 28px', borderBottom:'1px solid var(--border)' }}>
            <div style={{ fontFamily:'var(--font-display)', fontSize:18, fontWeight:800, color:'var(--text-primary)', letterSpacing:'-0.5px' }}>🚲 BikeBack</div>
            <div style={{ fontSize:11, color:'var(--text-secondary)', marginTop:2 }}>Pannello operativo</div>
          </div>
          <nav style={{ padding:'16px 10px', display:'flex', flexDirection:'column', gap:2 }}>
            {tabs.map(t => (
              <button key={t.id} onClick={() => setActiveTab(t.id)}
                style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 14px', borderRadius:9, border:'none', cursor:'pointer',
                  background: activeTab===t.id ? 'var(--accent)' : 'transparent',
                  color: activeTab===t.id ? '#fff' : 'var(--text-secondary)',
                  fontFamily:'var(--font-body)', fontSize:13, fontWeight:600, textAlign:'left', transition:'all 0.15s' }}>
                <span>{t.icon}</span><span>{t.label}</span>
              </button>
            ))}
          </nav>
        </aside>

        {/* Main */}
        <main style={{ flex:1, padding:'32px 36px', minWidth:0, overflowY:'auto' }}>
          <div style={{ maxWidth:1100 }}>
            <div style={{ fontFamily:'var(--font-display)', fontSize:26, fontWeight:800, color:'var(--text-primary)', letterSpacing:'-0.5px', marginBottom:28 }}>
              {tabs.find(t => t.id===activeTab)?.icon} {tabs.find(t => t.id===activeTab)?.label}
            </div>

            {loadingConfig ? (
              <div style={{ color:'var(--text-secondary)', padding:60, textAlign:'center' }}>Caricamento configurazione…</div>
            ) : config ? (
              <>
                {activeTab === 'config' && (
                  <TabConfig negozi={config.negozi} accessori={config.accessori} assicurazioni={config.assicurazioni}
                    onSuccess={onSuccess} onError={onError} reload={loadConfig} />
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
              <div style={{ color:'#ef4444', fontFamily:'var(--font-body)' }}>Errore nel caricamento della configurazione.</div>
            )}
          </div>
        </main>
      </div>

      {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
    </>
  )
}