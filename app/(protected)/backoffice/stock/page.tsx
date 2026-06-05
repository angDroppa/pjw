'use client'

import { useState, useEffect, useCallback } from 'react'
import { backofficeApi } from '@/lib/axios/backoffice'
import { Location } from '@/lib/zodSchemas/location'
import { BiciclettaCatalog } from '@/lib/zodSchemas/bicicletta'
import { Toast, Card, Btn, Field, Inp, SectionTitle, Sel, Modal } from '../components/ui'

interface Istanza {
  id: number
  codice: string
  occupata: boolean
  occupataDa: string | null
  occupataA: string | null
}

interface StockItem {
  id: number
  locationId: number
  biciclettaSpecificId: number
  quantita: number
  istanze?: Istanza[]
  biciclettaSpecific: {
    id: number
    size: string
    alimentazione: string
    prezzoGiornata: number
    prezzoMezzaGiornata: number
    bicicletta: { id: number; nome: string; tipologia: string }
  }
  location: { id: number; nome: string }
}

export default function StockPage() {
  const [stock, setStock] = useState<StockItem[]>([])
  const [catalogo, setCatalogo] = useState<BiciclettaCatalog[]>([])
  const [locations, setLocations] = useState<Location[]>([])
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState<{ msg: string; type: 'ok' | 'err' } | null>(null)
  const [showAddModal, setShowAddModal] = useState(false)
  const [newStock, setNewStock] = useState({
    biciclettaSpecificId: '',
    locationId: '',
    quantita: '1',
  })
  const [istanzeModal, setIstanzeModal] = useState<StockItem | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [config, cat] = await Promise.all([
        backofficeApi.getConfig(),
        backofficeApi.getCatalogo(),
      ])
      const allStock = config.negozi.flatMap(n =>
        (n as any).biciclette?.map((b: StockItem) => ({
          ...b,
          location: { id: n.id, nome: n.nome },
        })) ?? []
      )
      setStock(allStock)
      setCatalogo(cat.biciclette)
      setLocations(config.negozi.map(n => ({ id: n.id, nome: n.nome, indirizzo: (n as any).indirizzo ?? '' })))
    } catch { setToast({ msg: 'Errore caricamento', type: 'err' }) }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])

  const handleUpdateStock = async (id: number, quantita: number) => {
    try {
      await backofficeApi.updateStock(id, { quantita })
      setToast({ msg: 'Stock aggiornato', type: 'ok' })
      load()
    } catch { setToast({ msg: 'Errore aggiornamento', type: 'err' }) }
  }

  const handleAddStock = async () => {
    if (!newStock.biciclettaSpecificId || !newStock.locationId) {
      setToast({ msg: 'Compila tutti i campi', type: 'err' })
      return
    }
    try {
      await backofficeApi.aggiungiiBiciNegozio({
        biciclettaSpecificId: parseInt(newStock.biciclettaSpecificId),
        locationId: parseInt(newStock.locationId),
        quantita: parseInt(newStock.quantita) || 1,
      })
      setToast({ msg: 'Stock aggiunto', type: 'ok' })
      setShowAddModal(false)
      setNewStock({ biciclettaSpecificId: '', locationId: '', quantita: '1' })
      load()
    } catch { setToast({ msg: 'Errore', type: 'err' }) }
  }

  const handleGeneraIstanze = async (biciclettaLocationId: number) => {
    try {
      const res = await backofficeApi.generaIstanze(biciclettaLocationId)
      setToast({ msg: `${res.createCount} istanze generate`, type: 'ok' })
      load()
    } catch { setToast({ msg: 'Errore generazione istanze', type: 'err' }) }
  }

  return (
    <>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <Btn onClick={() => setShowAddModal(true)}>＋ Aggiungi stock</Btn>
        </div>

        <Card>
          {loading ? (
            <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: 40 }}>Caricamento...</p>
          ) : stock.length === 0 ? (
            <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: 40 }}>Nessuno stock configurato.</p>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, minWidth: 700 }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border)' }}>
                    {['Bicicletta', 'Taglia', 'Alimentazione', 'Negozio', 'Quantità', 'Istanze', 'Azioni'].map(h => (
                      <th key={h} style={{ textAlign: 'left', padding: '8px 10px', color: 'var(--text-secondary)', fontWeight: 600, fontSize: 11, textTransform: 'uppercase' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {stock.map(s => {
                    const numIstanze = s.istanze?.length ?? 0
                    const istanzeOk = numIstanze >= s.quantita
                    return (
                      <tr key={s.id} style={{ borderBottom: '1px solid var(--border)' }}>
                        <td style={{ padding: '8px 10px', fontWeight: 600 }}>{s.biciclettaSpecific.bicicletta.nome}</td>
                        <td style={{ padding: '8px 10px' }}>{s.biciclettaSpecific.size}</td>
                        <td style={{ padding: '8px 10px' }}>{s.biciclettaSpecific.alimentazione === 'ELETTRICA' ? '⚡ Elettrica' : '🚲 Muscolare'}</td>
                        <td style={{ padding: '8px 10px' }}>{s.location.nome}</td>
                        <td style={{ padding: '8px 10px', width: 80 }}>
                          <Inp
                            type="number"
                            value={String(s.quantita)}
                            onChange={v => handleUpdateStock(s.id, parseInt(v) || 0)}
                          />
                        </td>
                        <td style={{ padding: '8px 10px' }}>
                          <span style={{ color: istanzeOk ? 'var(--text)' : '#f59e0b', fontWeight: 600 }}>
                            {numIstanze}/{s.quantita}
                          </span>
                          {!istanzeOk && (
                            <span style={{ marginLeft: 6 }}>
                              <Btn small onClick={() => handleGeneraIstanze(s.id)}>
                                Genera
                              </Btn>
                            </span>
                          )}
                          {numIstanze > 0 && (
                            <span style={{ marginLeft: 6 }}>
                              <Btn small variant="ghost" onClick={() => setIstanzeModal(s)}>
                                Dettagli
                              </Btn>
                            </span>
                          )}
                        </td>
                        <td style={{ padding: '8px 10px' }}>
                          <Btn small onClick={() => handleUpdateStock(s.id, s.quantita)}>Salva</Btn>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>

      {showAddModal && (
        <Modal title="Aggiungi Stock" onClose={() => setShowAddModal(false)}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <Field label="Bicicletta">
              <Sel value={newStock.biciclettaSpecificId} onChange={v => setNewStock(p => ({ ...p, biciclettaSpecificId: v }))}>
                <option value="">Seleziona...</option>
                {catalogo.flatMap(b =>
                  b.specifics.map(s => (
                    <option key={s.id} value={s.id}>
                      {b.nome} - {s.size} ({s.alimentazione === 'ELETTRICA' ? 'E' : 'M'})
                    </option>
                  ))
                )}
              </Sel>
            </Field>
            <Field label="Negozio">
              <Sel value={newStock.locationId} onChange={v => setNewStock(p => ({ ...p, locationId: v }))}>
                <option value="">Seleziona...</option>
                {locations.map(l => (
                  <option key={l.id} value={l.id}>{l.nome}</option>
                ))}
              </Sel>
            </Field>
            <Field label="Quantità">
              <Inp type="number" value={newStock.quantita} onChange={v => setNewStock(p => ({ ...p, quantita: v }))} min="0" />
            </Field>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 8 }}>
              <Btn variant="ghost" onClick={() => setShowAddModal(false)}>Annulla</Btn>
              <Btn onClick={handleAddStock}>Aggiungi</Btn>
            </div>
          </div>
        </Modal>
      )}

      {istanzeModal && (
        <Modal title={`Istanze - ${istanzeModal.biciclettaSpecific.bicicletta.nome} (${istanzeModal.location.nome})`} onClose={() => setIstanzeModal(null)}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 400, overflowY: 'auto' }}>
            {(istanzeModal.istanze ?? []).length === 0 ? (
              <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: 20 }}>Nessuna istanza</p>
            ) : (
              (istanzeModal.istanze ?? []).map(ist => (
                <div key={ist.id} style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '8px 12px',
                  borderRadius: 8,
                  background: ist.occupata ? 'rgba(239,68,68,0.1)' : 'rgba(16,185,129,0.1)',
                  border: `1px solid ${ist.occupata ? 'rgba(239,68,68,0.3)' : 'rgba(16,185,129,0.3)'}`,
                }}>
                  <div>
                    <span style={{ fontWeight: 600, fontSize: 13 }}>{ist.codice}</span>
                    <span style={{ marginLeft: 8, fontSize: 11, color: 'var(--text-secondary)' }}>
                      {ist.occupata
                        ? `Occupata: ${ist.occupataDa ? new Date(ist.occupataDa).toLocaleDateString() : ''} - ${ist.occupataA ? new Date(ist.occupataA).toLocaleDateString() : ''}`
                        : 'Libera'}
                    </span>
                  </div>
                  <span style={{
                    fontSize: 11,
                    fontWeight: 600,
                    padding: '2px 8px',
                    borderRadius: 4,
                    background: ist.occupata ? 'rgba(239,68,68,0.2)' : 'rgba(16,185,129,0.2)',
                    color: ist.occupata ? '#ef4444' : '#10b981',
                  }}>
                    {ist.occupata ? 'Occupata' : 'Libera'}
                  </span>
                </div>
              ))
            )}
          </div>
        </Modal>
      )}

      {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
    </>
  )
}
