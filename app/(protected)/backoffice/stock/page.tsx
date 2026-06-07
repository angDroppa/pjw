'use client'

import { useState, useEffect } from 'react'
import { backofficeApi } from '@/lib/axios/backoffice'
import { BiciclettaResponse } from '@/lib/validators/bicicletta'
import { LocationResponse } from '@/lib/validators/location'
import { BiciclettaLocationResponse } from '@/lib/validators/biciclettaLocation'
import { Toast, Card, Btn, Field, Inp, Sel, Modal } from '../components/ui'

export default function StockPage() {
  const [stock,     setStock]     = useState<BiciclettaLocationResponse[]>([])
  const [catalogo,  setCatalogo]  = useState<BiciclettaResponse[]>([])
  const [locations, setLocations] = useState<LocationResponse[]>([])
  const [toast,     setToast]     = useState<{ msg: string; type: 'ok' | 'err' } | null>(null)
  const [showAddModal, setShowAddModal] = useState(false)
  const [reload, setReload] = useState(0)

  const [newStock, setNewStock] = useState({
    biciclettaSpecificId: '',
    locationId:           '',
    quantitaMuscolare:    '0',
    quantitaElettrica:    '0',
  })

  useEffect(() => {
    let cancelled = false
    Promise.all([
      backofficeApi.getStock(),
      backofficeApi.getCatalogo(),
    ])
      .then(([stockData, cat]) => {
        if (cancelled) return
        setStock(stockData)
        setCatalogo(cat.biciclette)
        setLocations(cat.negozi.map(n => ({ id: n.id, nome: n.nome, indirizzo: '' })))
      })
      .catch(() => {
        if (!cancelled) setToast({ msg: 'Errore caricamento', type: 'err' })
      })
    return () => { cancelled = true }
  }, [reload])

  const handleUpdateStock = async (
    id: number,
    quantitaMuscolare: number,
    quantitaElettrica: number,
  ) => {
    try {
      await backofficeApi.updateStock(id, { quantitaMuscolare, quantitaElettrica })
      setToast({ msg: 'Stock aggiornato', type: 'ok' })
      setReload(r => r + 1)
    } catch {
      setToast({ msg: 'Errore aggiornamento', type: 'err' })
    }
  }

  const handleAddStock = async () => {
    if (!newStock.biciclettaSpecificId || !newStock.locationId) {
      setToast({ msg: 'Compila tutti i campi', type: 'err' })
      return
    }
    try {
      await backofficeApi.aggiungiBiciNegozio({
        biciclettaSpecificId: parseInt(newStock.biciclettaSpecificId),
        locationId:           parseInt(newStock.locationId),
        quantitaMuscolare:    parseInt(newStock.quantitaMuscolare) || 0,
        quantitaElettrica:    parseInt(newStock.quantitaElettrica) || 0,
      })
      setToast({ msg: 'Stock aggiunto', type: 'ok' })
      setShowAddModal(false)
      setNewStock({ biciclettaSpecificId: '', locationId: '', quantitaMuscolare: '0', quantitaElettrica: '0' })
      setReload(r => r + 1)
    } catch {
      setToast({ msg: 'Errore', type: 'err' })
    }
  }

  return (
    <>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <Btn onClick={() => setShowAddModal(true)}>＋ Aggiungi stock</Btn>
        </div>

        <Card>
          {stock.length === 0 ? (
            <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: 40 }}>
              Nessuno stock configurato.
            </p>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, minWidth: 600 }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border)' }}>
                    {['Bicicletta', 'Taglia', 'Negozio', 'Q. Muscolare', 'Q. Elettrica', 'Azioni'].map(h => (
                      <th key={h} style={{
                        textAlign:     'left',
                        padding:       '8px 10px',
                        color:         'var(--text-secondary)',
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
                  {stock.map(s => (
                    <tr key={s.id} style={{ borderBottom: '1px solid var(--border)' }}>

                      <td style={{ padding: '8px 10px', fontWeight: 600, color: 'var(--text-primary)' }}>
                        {s.biciclettaSpecific.biciclettaId}
                      </td>

                      <td style={{ padding: '8px 10px', color: 'var(--text-primary)' }}>
                        {s.biciclettaSpecific.size}
                      </td>

                      <td style={{ padding: '8px 10px', color: 'var(--text-primary)' }}>
                        {s.location.nome}
                      </td>

                      <td style={{ padding: '8px 10px', width: 100 }}>
                        <Inp
                          type="number"
                          value={String(s.quantitaMuscolare)}
                          onChange={v => setStock(prev => prev.map(x =>
                            x.id === s.id ? { ...x, quantitaMuscolare: parseInt(v) || 0 } : x
                          ))}
                        />
                      </td>

                      <td style={{ padding: '8px 10px', width: 100 }}>
                        <Inp
                          type="number"
                          value={String(s.quantitaElettrica)}
                          onChange={v => setStock(prev => prev.map(x =>
                            x.id === s.id ? { ...x, quantitaElettrica: parseInt(v) || 0 } : x
                          ))}
                        />
                      </td>

                      <td style={{ padding: '8px 10px' }}>
                        <Btn small onClick={() => handleUpdateStock(s.id, s.quantitaMuscolare, s.quantitaElettrica)}>
                          Salva
                        </Btn>
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
              <Sel
                value={newStock.biciclettaSpecificId}
                onChange={v => setNewStock(p => ({ ...p, biciclettaSpecificId: v }))}
              >
                <option value="">Seleziona...</option>
                {catalogo.flatMap(b =>
                  b.specifics.map(s => (
                    <option key={s.id} value={s.id}>
                      {b.nome} - {s.size}
                    </option>
                  ))
                )}
              </Sel>
            </Field>

            <Field label="Negozio">
              <Sel
                value={newStock.locationId}
                onChange={v => setNewStock(p => ({ ...p, locationId: v }))}
              >
                <option value="">Seleziona...</option>
                {locations.map(l => (
                  <option key={l.id} value={l.id}>{l.nome}</option>
                ))}
              </Sel>
            </Field>

            <Field label="Quantità Muscolare">
              <Inp
                type="number"
                value={newStock.quantitaMuscolare}
                onChange={v => setNewStock(p => ({ ...p, quantitaMuscolare: v }))}
                min="0"
              />
            </Field>

            <Field label="Quantità Elettrica">
              <Inp
                type="number"
                value={newStock.quantitaElettrica}
                onChange={v => setNewStock(p => ({ ...p, quantitaElettrica: v }))}
                min="0"
              />
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