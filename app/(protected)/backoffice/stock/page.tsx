'use client'

import { useState, useEffect, useCallback } from 'react'
import { backofficeApi } from '@/lib/axios/backoffice'
import { Location } from '@/lib/zodSchemas/location'
import { BiciclettaCatalog } from '@/lib/zodSchemas/bicicletta'
import { Toast, Card, Btn, Field, Inp, SectionTitle, Sel, Modal } from '../components/ui'

interface StockItem {
  id: number
  locationId: number
  biciclettaSpecificId: number
  quantita: number
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
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, minWidth: 600 }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border)' }}>
                    {['Bicicletta', 'Taglia', 'Alimentazione', 'Negozio', 'Quantità', 'Azioni'].map(h => (
                      <th key={h} style={{ textAlign: 'left', padding: '8px 10px', color: 'var(--text-secondary)', fontWeight: 600, fontSize: 11, textTransform: 'uppercase' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {stock.map(s => (
                    <tr key={s.id} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: '8px 10px', fontWeight: 600 }}>{s.biciclettaSpecific.bicicletta.nome}</td>
                      <td style={{ padding: '8px 10px' }}>{s.biciclettaSpecific.size}</td>
                      <td style={{ padding: '8px 10px' }}>{s.biciclettaSpecific.alimentazione === 'ELETTRICA' ? '⚡ Elettrica' : '🚲 Muscolare'}</td>
                      <td style={{ padding: '8px 10px' }}>{s.location.nome}</td>
                      <td style={{ padding: '8px 10px', width: 100 }}>
                        <Inp
                          type="number"
                          value={String(s.quantita)}
                          onChange={v => handleUpdateStock(s.id, parseInt(v) || 0)}
                        />
                      </td>
                      <td style={{ padding: '8px 10px' }}>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <Btn small onClick={() => handleUpdateStock(s.id, s.quantita)}>Salva</Btn>
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

      {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
    </>
  )
}
