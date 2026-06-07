'use client'

import { useEffect, useState } from 'react'
import { backofficeApi } from '@/lib/axios/backoffice'
import { Toast, Card, Btn, Field } from '../components/ui'

interface StatisticheResponse {
  totalBookings:   number
  totalRevenue:    number
  shopPerformance: { name: string; revenue: number }[]
  mostUsedBikes:   { model: string; rentals: number }[]
  periodoFiltrato: { da: string; a: string } | null
}

export default function StatistichePage() {
  const [stats, setStats] = useState<StatisticheResponse | null>(null)
  const [toast, setToast] = useState<{ msg: string; type: 'ok' | 'err' } | null>(null)
  const [da, setDa] = useState('')
  const [a, setA] = useState('')
  const [filtri, setFiltri] = useState<{ da?: string; a?: string } | undefined>(undefined)

  useEffect(() => {
    let cancelled = false
    backofficeApi.getStatistiche(filtri)
      .then(data => { if (!cancelled) setStats(data) })
      .catch(() => { if (!cancelled) setToast({ msg: 'Errore caricamento statistiche', type: 'err' }) })
    return () => { cancelled = true }
  }, [filtri])

  return (
    <>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

        <Card>
          <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end', flexWrap: 'wrap' }}>
            <Field label="Da">
              <input type="date" value={da} onChange={e => setDa(e.target.value)}
                style={{ background: 'var(--input-bg)', border: '1px solid var(--border)', borderRadius: 8, padding: '8px 12px', color: 'var(--text-primary)', fontFamily: 'var(--font-body)', fontSize: 13 }} />
            </Field>
            <Field label="A">
              <input type="date" value={a} onChange={e => setA(e.target.value)}
                style={{ background: 'var(--input-bg)', border: '1px solid var(--border)', borderRadius: 8, padding: '8px 12px', color: 'var(--text-primary)', fontFamily: 'var(--font-body)', fontSize: 13 }} />
            </Field>
            <Btn onClick={() => setFiltri({ da: da || undefined, a: a || undefined })}>Applica filtro</Btn>
            <Btn variant="ghost" onClick={() => { setDa(''); setA(''); setFiltri(undefined) }}>Reset</Btn>
          </div>
        </Card>

        {stats ? (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14 }}>
              <Card>
                <div style={{ fontSize: 11, color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 600 }}>Totale Prenotazioni</div>
                <div style={{ fontSize: 32, fontWeight: 800, color: 'var(--text-primary)', marginTop: 8 }}>{stats.totalBookings}</div>
              </Card>
              <Card>
                <div style={{ fontSize: 11, color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 600 }}>Ricavi Totali</div>
                <div style={{ fontSize: 32, fontWeight: 800, color: '#10b981', marginTop: 8 }}>€{Number(stats.totalRevenue).toFixed(2)}</div>
              </Card>
            </div>

            <Card>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 16 }}>
                Performance Punti Vendita
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {stats.shopPerformance.map((s) => {
                  const maxRevenue = Math.max(...stats.shopPerformance.map(sp => sp.revenue), 1)
                  const pct = (s.revenue / maxRevenue) * 100
                  return (
                    <div key={s.name}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4 }}>
                        <span style={{ color: 'var(--text-primary)' }}>{s.name}</span>
                        <span style={{ color: '#10b981', fontWeight: 600 }}>€{Number(s.revenue).toFixed(2)}</span>
                      </div>
                      <div style={{ height: 8, background: 'var(--border)', borderRadius: 99, overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${pct}%`, background: 'linear-gradient(90deg, #4f7dff, #10b981)', borderRadius: 99, transition: 'width 0.5s ease' }} />
                      </div>
                    </div>
                  )
                })}
              </div>
            </Card>

            <Card>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 16 }}>
                Biciclette Più Noleggiate
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border)' }}>
                    <th style={{ textAlign: 'left', padding: '8px 10px', color: 'var(--text-secondary)', fontWeight: 600, fontSize: 11, textTransform: 'uppercase' }}>Modello</th>
                    <th style={{ textAlign: 'right', padding: '8px 10px', color: 'var(--text-secondary)', fontWeight: 600, fontSize: 11, textTransform: 'uppercase' }}>Noleggi</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.mostUsedBikes.map((b, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: '8px 10px', color: 'var(--text-primary)' }}>{b.model}</td>
                      <td style={{ padding: '8px 10px', textAlign: 'right', fontWeight: 600 }}>{b.rentals}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Card>
          </>
        ) : null}
      </div>

      {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
    </>
  )
}