'use client'

import { usePathname, useRouter } from 'next/navigation'

const tabs = [
  { id: 'config',       label: 'Configurazione', icon: '⚙️',  href: '/backoffice/config' },
  { id: 'prenotazioni', label: 'Prenotazioni',   icon: '📋', href: '/backoffice/prenotazioni' },
  { id: 'stock',        label: 'Stock',          icon: '🚲', href: '/backoffice/stock' },
  { id: 'statistiche',  label: 'Statistiche',    icon: '📊', href: '/backoffice/statistiche' },
]

export default function BackofficeLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router   = useRouter()

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
        * {  }
        body { background: var(--bg); }
        @keyframes slideUp { from { transform: translateY(12px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        input:focus, select:focus, textarea:focus { border-color: var(--accent) !important; outline: none; }
        ::-webkit-scrollbar { width: 5px; height: 5px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: var(--border); border-radius: 99px; }
      `}</style>

      <div style={{ display: 'flex', minHeight: '100vh', fontFamily: 'var(--font-body)' }}>

        {/* Sidebar */}
        <aside style={{
          width: 220, background: 'var(--sidebar-bg)', borderRight: '1px solid var(--border)',
          display: 'flex', flexDirection: 'column', padding: '28px 0',
          flexShrink: 0, position: 'sticky', top: 0, height: '100vh',
        }}>
          <div style={{ padding: '0 22px 28px', borderBottom: '1px solid var(--border)' }}>
            <div style={{
              fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 800,
              color: 'var(--text-primary)', letterSpacing: '-0.5px',
            }}>🚲 BikeBack</div>
            <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 2 }}>Pannello operativo</div>
          </div>

          <nav style={{ padding: '16px 10px', display: 'flex', flexDirection: 'column', gap: 2 }}>
            {tabs.map(t => {
              const active = pathname.startsWith(t.href)
              return (
                <button key={t.id} onClick={() => router.push(t.href)} style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '10px 14px', borderRadius: 9, border: 'none', cursor: 'pointer',
                  background: active ? 'var(--accent)' : 'transparent',
                  color: active ? '#fff' : 'var(--text-secondary)',
                  fontFamily: 'var(--font-body)', fontSize: 13, fontWeight: 600,
                  textAlign: 'left', transition: 'all 0.15s',
                }}>
                  <span>{t.icon}</span><span>{t.label}</span>
                </button>
              )
            })}
          </nav>
        </aside>

        {/* Main */}
        <main style={{ flex: 1, padding: '32px 36px', minWidth: 0, overflowY: 'auto', background: 'var(--bg)' }}>
          <div style={{ maxWidth: 1100 }}>
            {(() => {
              const tab = tabs.find(t => pathname.startsWith(t.href))
              if (!tab) return null
              return (
                <div style={{
                  fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 800,
                  color: 'var(--text-primary)', letterSpacing: '-0.5px', marginBottom: 28,
                }}>
                  {tab.icon} {tab.label}
                </div>
              )
            })()}
            {children}
          </div>
        </main>

      </div>
    </>
  )
}