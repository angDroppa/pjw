'use client'

import { backofficeApi, CatalogoResponse } from '@/lib/axios/backoffice'
import { useState, useEffect, useCallback } from 'react'
import { Card, SectionTitle, Btn, Field, Inp, Sel, Modal, Toast } from '../components/ui'
import { TipologiaBicicletta } from '@/app/generated/prisma/enums'
import { BiciclettaResponse, CreateSpecificheSchema, UpdateSpecificheSchema } from '@/lib/validators/bicicletta'

const TIPOLOGIE: TipologiaBicicletta[] = ['CITY', 'MOUNTAIN', 'GRAVEL', 'ROAD']

type SpecificaEdit = {
  id: number
  size: string
  prezzoGiornata: string
  prezzoMezzaGiornata: string
  altezzaMin: string
  altezzaMax: string
}

export default function BiciclettePage() {
  const [catalogo,  setCatalogo]  = useState<CatalogoResponse | null>(null)
  const [loading,   setLoading]   = useState(true)
  const [toast,     setToast]     = useState<{ msg: string; type: 'ok' | 'err' } | null>(null)

  const [showNew,   setShowNew]   = useState(false)
  const [newNome,   setNewNome]   = useState('')
  const [newTipol,  setNewTipol]  = useState<TipologiaBicicletta>('CITY')
  const [savingMod, setSavingMod] = useState(false)

  const [showSpec,   setShowSpec]   = useState<number | null>(null)
  const [specSize,   setSpecSize]   = useState('S')
  const [specPrezG,  setSpecPrezG]  = useState('')
  const [specPrezMG, setSpecPrezMG] = useState('')
  const [specAltMin, setSpecAltMin] = useState('')
  const [specAltMax, setSpecAltMax] = useState('')
  const [savingSpec, setSavingSpec] = useState(false)

  const [editSpec,   setEditSpec]   = useState<SpecificaEdit | null>(null)
  const [savingEdit, setSavingEdit] = useState(false)

  const onSuccess = useCallback((msg: string) => setToast({ msg, type: 'ok' }), [])
  const onError   = useCallback((msg: string) => setToast({ msg, type: 'err' }), [])

  const reload = useCallback(() => {
    setLoading(true)
    backofficeApi.getCatalogo()
      .then(data => setCatalogo(data))
      .catch(() => onError('Errore caricamento catalogo'))
      .finally(() => setLoading(false))
  }, [onError])

  useEffect(() => {
    backofficeApi.getCatalogo()
      .then(data => setCatalogo(data))
      .catch(() => onError('Errore caricamento catalogo'))
      .finally(() => setLoading(false))
  }, [onError])

  const createBici = async () => {
    if (!newNome.trim()) return onError('Inserisci un nome')
    setSavingMod(true)
    try {
      await backofficeApi.createBicicletta({ nome: newNome.trim(), tipologia: newTipol, specifics: [] })
      onSuccess('Modello creato')
      setShowNew(false)
      setNewNome('')
      setNewTipol('CITY')
      reload()
    } catch { onError('Errore creazione modello') }
    finally { setSavingMod(false) }
  }

  const createSpec = async (biciclettaId: number) => {
    const payload = {
      biciclettaId,
      size: specSize,
      prezzoGiornata: parseFloat(specPrezG),
      prezzoMezzaGiornata: parseFloat(specPrezMG),
      ...(specAltMin ? { altezzaMin: parseInt(specAltMin) } : {}),
      ...(specAltMax ? { altezzaMax: parseInt(specAltMax) } : {}),
    }
    const parsed = CreateSpecificheSchema.safeParse(payload)
    if (!parsed.success) {
      const msg = parsed.error.flatten().fieldErrors
      const first = Object.values(msg).flat()[0]
      return onError(first ?? 'Dati non validi')
    }
    setSavingSpec(true)
    try {
      await backofficeApi.createSpecifica(parsed.data)
      onSuccess('Specifica aggiunta')
      setShowSpec(null)
      setSpecSize('S')
      setSpecPrezG('')
      setSpecPrezMG('')
      setSpecAltMin('')
      setSpecAltMax('')
      reload()
    } catch { onError('Errore creazione specifica') }
    finally { setSavingSpec(false) }
  }

  const updateSpec = async () => {
    if (!editSpec) return
    const payload = {
      ...(editSpec.size             ? { size: editSpec.size }                                          : {}),
      ...(editSpec.prezzoGiornata   ? { prezzoGiornata: parseFloat(editSpec.prezzoGiornata) }         : {}),
      ...(editSpec.prezzoMezzaGiornata ? { prezzoMezzaGiornata: parseFloat(editSpec.prezzoMezzaGiornata) } : {}),
      ...(editSpec.altezzaMin       ? { altezzaMin: parseInt(editSpec.altezzaMin) }                   : {}),
      ...(editSpec.altezzaMax       ? { altezzaMax: parseInt(editSpec.altezzaMax) }                   : {}),
    }
    const parsed = UpdateSpecificheSchema.safeParse(payload)
    if (!parsed.success) {
      const msg = parsed.error.flatten().fieldErrors
      const first = Object.values(msg).flat()[0]
      return onError(first ?? 'Dati non validi')
    }
    setSavingEdit(true)
    try {
      await backofficeApi.updateSpecifica(editSpec.id, parsed.data)
      onSuccess('Specifica aggiornata')
      setEditSpec(null)
      reload()
    } catch { onError('Errore aggiornamento specifica') }
    finally { setSavingEdit(false) }
  }

  const deleteBici = async (id: number) => {
    if (!confirm('Eliminare questo modello e tutte le sue specifiche?')) return
    try {
      await backofficeApi.deleteBicicletta(id)
      onSuccess('Modello eliminato')
      reload()
    } catch { onError('Errore eliminazione') }
  }

  const deleteSpec = async (id: number) => {
    if (!confirm('Eliminare questa specifica?')) return
    try {
      await backofficeApi.deleteSpecifica(id)
      onSuccess('Specifica eliminata')
      reload()
    } catch { onError('Errore eliminazione') }
  }

  if (loading) return (
    <div style={{ color: 'var(--text-secondary)', padding: 60, textAlign: 'center' }}>
      Caricamento…
    </div>
  )

  return (
    <>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <SectionTitle>Modelli Biciclette</SectionTitle>
        <Btn small onClick={() => setShowNew(true)}>＋ Nuovo modello</Btn>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {catalogo?.biciclette.map(bici => (
          <BiciCard
            key={bici.id}
            bici={bici}
            onAddSpec={() => setShowSpec(bici.id)}
            onDelete={() => deleteBici(bici.id)}
            onDeleteSpec={deleteSpec}
            onEditSpec={s => setEditSpec({
              id:                  s.id,
              size:                s.size,
              prezzoGiornata:      String(s.prezzoGiornata),
              prezzoMezzaGiornata: String(s.prezzoMezzaGiornata),
              altezzaMin:          s.altezzaMin != null ? String(s.altezzaMin) : '',
              altezzaMax:          s.altezzaMax != null ? String(s.altezzaMax) : '',
            })}
          />
        ))}

        {!catalogo?.biciclette.length && (
          <Card>
            <div style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: 20 }}>
              Nessun modello ancora. Creane uno!
            </div>
          </Card>
        )}
      </div>

      {/* ── Modal nuova specifica ── */}
      {showSpec !== null && (
        <Modal title="Nuova Specifica" onClose={() => setShowSpec(null)}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <Field label="Taglia">
              <Sel value={specSize} onChange={setSpecSize}>
                <option value="S">S</option>
                <option value="M">M</option>
                <option value="L">L</option>
              </Sel>
            </Field>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <Field label="Prezzo giornata (€)">
                <Inp type="number" value={specPrezG} onChange={setSpecPrezG} placeholder="29.99" min="0" />
              </Field>
              <Field label="Prezzo mezza giornata (€)">
                <Inp type="number" value={specPrezMG} onChange={setSpecPrezMG} placeholder="19.99" min="0" />
              </Field>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <Field label="Altezza min (cm)">
                <Inp type="number" value={specAltMin} onChange={setSpecAltMin} placeholder="150" min="0" />
              </Field>
              <Field label="Altezza max (cm)">
                <Inp type="number" value={specAltMax} onChange={setSpecAltMax} placeholder="190" min="0" />
              </Field>
            </div>

            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 8 }}>
              <Btn variant="ghost" onClick={() => setShowSpec(null)}>Annulla</Btn>
              <Btn onClick={() => createSpec(showSpec)} disabled={savingSpec}>
                {savingSpec ? 'Salvataggio…' : 'Aggiungi specifica'}
              </Btn>
            </div>
          </div>
        </Modal>
      )}

      {/* ── Modal modifica specifica ── */}
      {editSpec !== null && (
        <Modal title="Modifica Specifica" onClose={() => setEditSpec(null)}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <Field label="Taglia">
              <Sel value={editSpec.size} onChange={v => setEditSpec(e => e && ({ ...e, size: v }))}>
                <option value="S">S</option>
                <option value="M">M</option>
                <option value="L">L</option>
              </Sel>
            </Field>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <Field label="Prezzo giornata (€)">
                <Inp type="number" value={editSpec.prezzoGiornata}
                  onChange={v => setEditSpec(e => e && ({ ...e, prezzoGiornata: v }))}
                  placeholder="29.99" min="0" />
              </Field>
              <Field label="Prezzo mezza giornata (€)">
                <Inp type="number" value={editSpec.prezzoMezzaGiornata}
                  onChange={v => setEditSpec(e => e && ({ ...e, prezzoMezzaGiornata: v }))}
                  placeholder="19.99" min="0" />
              </Field>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <Field label="Altezza min (cm)">
                <Inp type="number" value={editSpec.altezzaMin}
                  onChange={v => setEditSpec(e => e && ({ ...e, altezzaMin: v }))}
                  placeholder="150" min="0" />
              </Field>
              <Field label="Altezza max (cm)">
                <Inp type="number" value={editSpec.altezzaMax}
                  onChange={v => setEditSpec(e => e && ({ ...e, altezzaMax: v }))}
                  placeholder="190" min="0" />
              </Field>
            </div>

            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 8 }}>
              <Btn variant="ghost" onClick={() => setEditSpec(null)}>Annulla</Btn>
              <Btn onClick={updateSpec} disabled={savingEdit}>
                {savingEdit ? 'Salvataggio…' : 'Salva modifiche'}
              </Btn>
            </div>
          </div>
        </Modal>
      )}

      {/* ── Modal nuovo modello ── */}
      {showNew && (
        <Modal title="Nuovo Modello Bicicletta" onClose={() => setShowNew(false)}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <Field label="Nome modello">
              <Inp value={newNome} onChange={setNewNome} placeholder="es. City Bike, MTB, Gravel…" />
            </Field>
            <Field label="Tipologia">
              <Sel value={newTipol} onChange={v => setNewTipol(v as TipologiaBicicletta)}>
                {TIPOLOGIE.map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </Sel>
            </Field>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 8 }}>
              <Btn variant="ghost" onClick={() => setShowNew(false)}>Annulla</Btn>
              <Btn onClick={createBici} disabled={savingMod}>
                {savingMod ? 'Creazione…' : 'Crea modello'}
              </Btn>
            </div>
          </div>
        </Modal>
      )}

      {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
    </>
  )
}

// ─── BiciCard ─────────────────────────────────────────────────────────────────

const LABEL_TIPOLOGIA: Record<string, string> = {
  CITY: 'City Bike', MOUNTAIN: 'Mountain Bike', GRAVEL: 'Gravel', ROAD: 'Road',
}

function BiciCard({ bici, onAddSpec, onDelete, onDeleteSpec, onEditSpec }: {
  bici: BiciclettaResponse
  onAddSpec: () => void
  onDelete: () => void
  onDeleteSpec: (id: number) => void
  onEditSpec: (s: BiciclettaResponse['specifics'][number]) => void
}) {
  return (
    <Card>
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        marginBottom: 14,
      }}>
        <div>
          <div style={{
            fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 16,
            color: 'var(--text-primary)',
          }}>{bici.nome}</div>
          <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>
            {LABEL_TIPOLOGIA[bici.tipologia] ?? bici.tipologia}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <Btn small onClick={onAddSpec}>＋ Specifica</Btn>
          <Btn small variant="danger" onClick={onDelete}>Elimina</Btn>
        </div>
      </div>

      {bici.specifics.length > 0 ? (
        <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: 'var(--font-body)', fontSize: 13 }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border)' }}>
              {['Taglia', '€/gg', '€/½gg', 'Altezza', ''].map(h => (
                <th key={h} style={{
                  textAlign: 'left', padding: '6px 10px', color: 'var(--text-secondary)',
                  fontWeight: 600, fontSize: 11, textTransform: 'uppercase',
                }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {bici.specifics.map(s => (
              <tr key={s.id} style={{ borderBottom: '1px solid var(--border)' }}>
                <td style={{ padding: '8px 10px', color: 'var(--text-primary)' }}>{s.size}</td>
                <td style={{ padding: '8px 10px', color: 'var(--text-primary)' }}>
                  €{Number(s.prezzoGiornata).toFixed(2)}
                </td>
                <td style={{ padding: '8px 10px', color: 'var(--text-primary)' }}>
                  €{Number(s.prezzoMezzaGiornata).toFixed(2)}
                </td>
                <td style={{ padding: '8px 10px', color: 'var(--text-secondary)', fontSize: 12 }}>
                  {s.altezzaMin || s.altezzaMax
                    ? `${s.altezzaMin ?? '—'}–${s.altezzaMax ?? '—'} cm`
                    : '—'}
                </td>
                <td style={{ padding: '8px 10px', width: 100 }}>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <Btn small onClick={() => onEditSpec(s)}>✏️</Btn>
                    <Btn small variant="danger" onClick={() => onDeleteSpec(s.id)}>✕</Btn>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <div style={{ color: 'var(--text-secondary)', fontSize: 13, padding: '8px 0' }}>
          Nessuna specifica. Aggiungine una!
        </div>
      )}
    </Card>
  )
}