'use client'

import { backofficeApi } from '@/lib/axios/backoffice'
import { useState, useEffect, useCallback } from 'react'
import { LocationResponse, UpdateLocation } from '@/lib/validators/location'
import { AccessorioResponse, UpdateAccessorio } from '@/lib/validators/accessorio'
import { AssicurazioneResponse, UpdateAssicurazione } from '@/lib/validators/assicurazione'
import { Toast, SectionTitle, Card, Btn, Field, Inp, Modal, InlineInput } from '../components/ui'

export default function ConfigPage() {
  const [negozi,        setNegozi]        = useState<LocationResponse[]>([])
  const [accessori,     setAccessori]     = useState<AccessorioResponse[]>([])
  const [assicurazioni, setAssicurazioni] = useState<AssicurazioneResponse[]>([])
  const [loading,       setLoading]       = useState(true)
  const [toast,         setToast]         = useState<{ msg: string; type: 'ok' | 'err' } | null>(null)

  const onSuccess = useCallback((msg: string) => setToast({ msg, type: 'ok' }), [])
  const onError   = useCallback((msg: string) => setToast({ msg, type: 'err' }), [])

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const data = await backofficeApi.getConfig()
      setNegozi(data.negozi)
      setAccessori(data.accessori)
      setAssicurazioni(data.assicurazioni)
    } catch { onError('Errore caricamento configurazione') }
    finally { setLoading(false) }
  }, [onError])

  useEffect(() => {
    let cancelled = false

    async function fetchData() {
      setLoading(true)
      try {
        const data = await backofficeApi.getConfig()
        if (cancelled) return
        setNegozi(data.negozi)
        setAccessori(data.accessori)
        setAssicurazioni(data.assicurazioni)
      } catch {
        if (!cancelled) onError('Errore caricamento configurazione')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    fetchData()
    return () => { cancelled = true }
  }, [onError])

  if (loading) return (
    <div style={{ color: 'var(--text-secondary)', padding: 60, textAlign: 'center' }}>
      Caricamento…
    </div>
  )

  return (
    <>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 36 }}>
        <SezioneNegozi
          negozi={negozi} onSuccess={onSuccess} onError={onError} reload={load}
        />
        <SezioneAccessori
          accessori={accessori} onSuccess={onSuccess} onError={onError} reload={load}
        />
        <SezioneAssicurazioni
          assicurazioni={assicurazioni} onSuccess={onSuccess} onError={onError} reload={load}
        />
      </div>
      {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
    </>
  )
}

// ─── Sezione Negozi ───────────────────────────────────────────────────────────

function SezioneNegozi({ negozi, onSuccess, onError, reload }: {
  negozi: LocationResponse[]
  onSuccess: (m: string) => void
  onError: (m: string) => void
  reload: () => void
}) {
  const [edits,     setEdits]     = useState<Record<number, Partial<UpdateLocation>>>({})
  const [showModal, setShowModal] = useState(false)
  const [newLoc,    setNewLoc]    = useState({ nome: '', indirizzo: '' })
  const [saving,    setSaving]    = useState(false)

  const save = async (id: number) => {
    try {
      await backofficeApi.updateLocation(id, edits[id] ?? {})
      onSuccess('Negozio aggiornato')
      reload()
    } catch { onError('Errore aggiornamento negozio') }
  }

  const remove = async (id: number) => {
    if (!confirm('Eliminare questo negozio?')) return
    try {
      await backofficeApi.deleteLocation(id)
      onSuccess('Negozio eliminato')
      reload()
    } catch { onError('Errore eliminazione negozio') }
  }

  const create = async () => {
    if (!newLoc.nome || !newLoc.indirizzo) return onError('Nome e indirizzo obbligatori')
    setSaving(true)
    try {
      await backofficeApi.createLocation(newLoc)
      onSuccess('Negozio creato')
      setShowModal(false)
      setNewLoc({ nome: '', indirizzo: '' })
      reload()
    } catch { onError('Errore creazione negozio') }
    finally { setSaving(false) }
  }

  return (
    <section>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <SectionTitle>Punti Vendita</SectionTitle>
        <Btn small onClick={() => setShowModal(true)}>＋ Nuovo negozio</Btn>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 14 }}>
        {negozi.map(n => {
          const d = edits[n.id] ?? {}
          return (
            <Card key={n.id}>
              <div style={{
                fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 15,
                marginBottom: 14, color: 'var(--text-primary)',
              }}>{n.nome}</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <Field label="Nome">
                  <InlineInput
                    value={d.nome ?? n.nome}
                    onChange={v => setEdits(p => ({ ...p, [n.id]: { ...p[n.id], nome: v } }))}
                  />
                </Field>
                <Field label="Indirizzo">
                  <InlineInput
                    value={d.indirizzo ?? n.indirizzo}
                    onChange={v => setEdits(p => ({ ...p, [n.id]: { ...p[n.id], indirizzo: v } }))}
                  />
                </Field>
                <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                  <Btn small onClick={() => save(n.id)}>Salva</Btn>
                  <Btn small variant="danger" onClick={() => remove(n.id)}>Elimina</Btn>
                </div>
              </div>
            </Card>
          )
        })}
      </div>

      {showModal && (
        <Modal title="Nuovo Punto Vendita" onClose={() => setShowModal(false)}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <Field label="Nome negozio">
              <Inp value={newLoc.nome} onChange={v => setNewLoc(p => ({ ...p, nome: v }))} placeholder="es. BikeRent Centro" />
            </Field>
            <Field label="Indirizzo">
              <Inp value={newLoc.indirizzo} onChange={v => setNewLoc(p => ({ ...p, indirizzo: v }))} placeholder="Via Roma 1, Milano" />
            </Field>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 8 }}>
              <Btn variant="ghost" onClick={() => setShowModal(false)}>Annulla</Btn>
              <Btn onClick={create} disabled={saving}>{saving ? 'Creazione…' : 'Crea negozio'}</Btn>
            </div>
          </div>
        </Modal>
      )}
    </section>
  )
}

// ─── Sezione Accessori ────────────────────────────────────────────────────────

function SezioneAccessori({ accessori, onSuccess, onError, reload }: {
  accessori: AccessorioResponse[]
  onSuccess: (m: string) => void
  onError: (m: string) => void
  reload: () => void
}) {
  const [edits,     setEdits]     = useState<Record<number, Partial<UpdateAccessorio>>>({})
  const [showModal, setShowModal] = useState(false)
  const [newAcc,    setNewAcc]    = useState({ nome: '', prezzo: '' })
  const [saving,    setSaving]    = useState(false)

  const save = async (id: number) => {
    try {
      await backofficeApi.updateAccessorio(id, edits[id] ?? {})
      onSuccess('Accessorio aggiornato')
      reload()
    } catch { onError('Errore aggiornamento accessorio') }
  }

  const remove = async (id: number) => {
    if (!confirm('Eliminare questo accessorio?')) return
    try {
      await backofficeApi.deleteAccessorio(id)
      onSuccess('Accessorio eliminato')
      reload()
    } catch { onError('Errore eliminazione accessorio') }
  }

  const create = async () => {
    if (!newAcc.nome) return onError('Nome obbligatorio')
    setSaving(true)
    try {
      await backofficeApi.createAccessorio({ nome: newAcc.nome, prezzo: parseFloat(newAcc.prezzo) || 0 })
      onSuccess('Accessorio creato')
      setShowModal(false)
      setNewAcc({ nome: '', prezzo: '' })
      reload()
    } catch { onError('Errore creazione accessorio') }
    finally { setSaving(false) }
  }

  return (
    <section>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <SectionTitle>Accessori</SectionTitle>
        <Btn small onClick={() => setShowModal(true)}>＋ Nuovo accessorio</Btn>
      </div>

      <Card>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: 'var(--font-body)', fontSize: 13 }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border)' }}>
              {['Nome', 'Prezzo (€)', ''].map(h => (
                <th key={h} style={{
                  textAlign: 'left', padding: '6px 10px', color: 'var(--text-secondary)',
                  fontWeight: 600, fontSize: 11, textTransform: 'uppercase',
                }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {accessori.map(a => {
              const d = edits[a.id] ?? {}
              return (
                <tr key={a.id} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '8px 10px' }}>
                    <InlineInput
                      value={d.nome ?? a.nome}
                      onChange={v => setEdits(p => ({ ...p, [a.id]: { ...p[a.id], nome: v } }))}
                    />
                  </td>
                  <td style={{ padding: '8px 10px', width: 130 }}>
                    <InlineInput
                      type="number"
                      value={String(d.prezzo ?? a.prezzo)}
                      onChange={v => setEdits(p => ({ ...p, [a.id]: { ...p[a.id], prezzo: parseFloat(v) } }))}
                    />
                  </td>
                  <td style={{ padding: '8px 10px', width: 120 }}>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <Btn small onClick={() => save(a.id)}>Salva</Btn>
                      <Btn small variant="danger" onClick={() => remove(a.id)}>✕</Btn>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </Card>

      {showModal && (
        <Modal title="Nuovo Accessorio" onClose={() => setShowModal(false)}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <Field label="Nome">
              <Inp value={newAcc.nome} onChange={v => setNewAcc(p => ({ ...p, nome: v }))} placeholder="es. Casco, Lucchetto…" />
            </Field>
            <Field label="Prezzo (€)">
              <Inp type="number" value={newAcc.prezzo} onChange={v => setNewAcc(p => ({ ...p, prezzo: v }))} placeholder="0.00" min="0" />
            </Field>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 8 }}>
              <Btn variant="ghost" onClick={() => setShowModal(false)}>Annulla</Btn>
              <Btn onClick={create} disabled={saving}>{saving ? 'Creazione…' : 'Crea accessorio'}</Btn>
            </div>
          </div>
        </Modal>
      )}
    </section>
  )
}

// ─── Sezione Assicurazioni ────────────────────────────────────────────────────

function SezioneAssicurazioni({ assicurazioni, onSuccess, onError, reload }: {
  assicurazioni: AssicurazioneResponse[]
  onSuccess: (m: string) => void
  onError: (m: string) => void
  reload: () => void
}) {
  const [edits,     setEdits]     = useState<Record<number, Partial<UpdateAssicurazione>>>({})
  const [showModal, setShowModal] = useState(false)
  const [newAss,    setNewAss]    = useState({ tipo: '', dettagli: '', prezzo: '' })
  const [saving,    setSaving]    = useState(false)

  const save = async (id: number) => {
    try {
      await backofficeApi.updateAssicurazione(id, edits[id] ?? {})
      onSuccess('Assicurazione aggiornata')
      reload()
    } catch { onError('Errore aggiornamento assicurazione') }
  }

  const remove = async (id: number) => {
    if (!confirm('Eliminare questa assicurazione?')) return
    try {
      await backofficeApi.deleteAssicurazione(id)
      onSuccess('Assicurazione eliminata')
      reload()
    } catch { onError('Errore eliminazione assicurazione') }
  }

  const create = async () => {
    if (!newAss.tipo || !newAss.dettagli) return onError('Tipo e dettagli obbligatori')
    setSaving(true)
    try {
      await backofficeApi.createAssicurazione({
        tipo: newAss.tipo, dettagli: newAss.dettagli, prezzo: parseFloat(newAss.prezzo) || 0,
      })
      onSuccess('Assicurazione creata')
      setShowModal(false)
      setNewAss({ tipo: '', dettagli: '', prezzo: '' })
      reload()
    } catch { onError('Errore creazione assicurazione') }
    finally { setSaving(false) }
  }

  return (
    <section>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <SectionTitle>Assicurazioni</SectionTitle>
        <Btn small onClick={() => setShowModal(true)}>＋ Nuova assicurazione</Btn>
      </div>

      <Card>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: 'var(--font-body)', fontSize: 13 }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border)' }}>
              {['Tipo', 'Dettagli', 'Prezzo (€)', ''].map(h => (
                <th key={h} style={{
                  textAlign: 'left', padding: '6px 10px', color: 'var(--text-secondary)',
                  fontWeight: 600, fontSize: 11, textTransform: 'uppercase',
                }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {assicurazioni.map(a => {
              const d = edits[a.id] ?? {}
              return (
                <tr key={a.id} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '8px 10px', width: 130 }}>
                    <InlineInput
                      value={d.tipo ?? a.tipo}
                      onChange={v => setEdits(p => ({ ...p, [a.id]: { ...p[a.id], tipo: v } }))}
                    />
                  </td>
                  <td style={{ padding: '8px 10px' }}>
                    <InlineInput
                      value={d.dettagli ?? a.dettagli}
                      onChange={v => setEdits(p => ({ ...p, [a.id]: { ...p[a.id], dettagli: v } }))}
                    />
                  </td>
                  <td style={{ padding: '8px 10px', width: 120 }}>
                    <InlineInput
                      type="number"
                      value={String(d.prezzo ?? a.prezzo)}
                      onChange={v => setEdits(p => ({ ...p, [a.id]: { ...p[a.id], prezzo: parseFloat(v) } }))}
                    />
                  </td>
                  <td style={{ padding: '8px 10px', width: 120 }}>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <Btn small onClick={() => save(a.id)}>Salva</Btn>
                      <Btn small variant="danger" onClick={() => remove(a.id)}>✕</Btn>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </Card>

      {showModal && (
        <Modal title="Nuova Assicurazione" onClose={() => setShowModal(false)}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <Field label="Tipo">
              <Inp value={newAss.tipo} onChange={v => setNewAss(p => ({ ...p, tipo: v }))} placeholder="es. Kasko, Base…" />
            </Field>
            <Field label="Dettagli">
              <Inp value={newAss.dettagli} onChange={v => setNewAss(p => ({ ...p, dettagli: v }))} placeholder="Descrizione copertura" />
            </Field>
            <Field label="Prezzo (€)">
              <Inp type="number" value={newAss.prezzo} onChange={v => setNewAss(p => ({ ...p, prezzo: v }))} placeholder="0.00" min="0" />
            </Field>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 8 }}>
              <Btn variant="ghost" onClick={() => setShowModal(false)}>Annulla</Btn>
              <Btn onClick={create} disabled={saving}>{saving ? 'Creazione…' : 'Crea assicurazione'}</Btn>
            </div>
          </div>
        </Modal>
      )}
    </section>
  )
}