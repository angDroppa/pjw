'use client'

import { useEffect } from 'react'

// ─── Toast ────────────────────────────────────────────────────────────────────

export function Toast({ msg, type, onClose }: {
  msg: string; type: 'ok' | 'err'; onClose: () => void
}) {
  useEffect(() => {
    const t = setTimeout(onClose, 3500)
    return () => clearTimeout(t)
  }, [onClose])

  return (
    <div style={{
      position: 'fixed', bottom: 24, right: 24, zIndex: 9999,
      background: type === 'ok' ? 'var(--accent)' : 'oklch(52% 0.22 25)',
      color: '#fff', padding: '12px 20px', borderRadius: 10,
      fontFamily: 'var(--font-body)', fontSize: 14, fontWeight: 600,
      boxShadow: '0 8px 32px rgba(0,0,0,0.25)', animation: 'slideUp 0.25s ease',
    }}>{msg}</div>
  )
}

// ─── SectionTitle ─────────────────────────────────────────────────────────────

export function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 style={{
      fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 700,
      color: 'var(--text-primary)', marginBottom: 16, letterSpacing: '-0.5px',
      borderLeft: '3px solid var(--accent)', paddingLeft: 12,
    }}>{children}</h2>
  )
}

// ─── Card ─────────────────────────────────────────────────────────────────────

export function Card({ children, style }: {
  children: React.ReactNode; style?: React.CSSProperties
}) {
  return (
    <div style={{
      background: 'var(--card-bg)', border: '1px solid var(--border)',
      borderRadius: 14, padding: '20px 24px',
      boxShadow: '0 2px 12px rgba(0,0,0,0.06)', ...style,
    }}>{children}</div>
  )
}

// ─── Btn ──────────────────────────────────────────────────────────────────────

type BtnVariant = 'primary' | 'ghost' | 'danger' | 'success' | 'warning'

export function Btn({ children, onClick, variant = 'primary', small, disabled, type = 'button' }: {
  children: React.ReactNode; onClick?: () => void; type?: 'button' | 'submit'
  variant?: BtnVariant; small?: boolean; disabled?: boolean
}) {
  const themes: Record<BtnVariant, [string, string]> = {
    primary: ['var(--accent)', '#fff'],
    ghost:   ['transparent', 'var(--text-secondary)'],
    danger:  ['#ef4444', '#fff'],
    success: ['#10b981', '#fff'],
    warning: ['#f59e0b', '#fff'],
  }
  const [bg, col] = themes[variant]

  return (
    <button type={type} onClick={onClick} disabled={disabled} style={{
      background: bg, color: col,
      border: variant === 'ghost' ? '1px solid var(--border)' : 'none',
      borderRadius: 8, padding: small ? '5px 12px' : '9px 18px',
      fontSize: small ? 12 : 13, fontWeight: 600,
      cursor: disabled ? 'not-allowed' : 'pointer',
      fontFamily: 'var(--font-body)', opacity: disabled ? 0.5 : 1,
      transition: 'opacity 0.15s',
    }}>{children}</button>
  )
}

// ─── Field ────────────────────────────────────────────────────────────────────

export function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <span style={{
        fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)',
        textTransform: 'uppercase', letterSpacing: '0.05em',
      }}>{label}</span>
      {children}
    </label>
  )
}

// ─── Inp ──────────────────────────────────────────────────────────────────────

export function Inp({ value, onChange, type = 'text', placeholder, min }: {
  value: string; onChange: (v: string) => void
  type?: string; placeholder?: string; min?: string
}) {
  return (
    <input type={type} value={value} placeholder={placeholder} min={min}
      onChange={e => onChange(e.target.value)}
      style={{
        background: 'var(--input-bg)', border: '1px solid var(--border)', borderRadius: 8,
        padding: '8px 12px', color: 'var(--text-primary)',
        fontFamily: 'var(--font-body)', fontSize: 13, outline: 'none',
      }}
    />
  )
}

// ─── Sel ──────────────────────────────────────────────────────────────────────

export function Sel({ value, onChange, children }: {
  value: string; onChange: (v: string) => void; children: React.ReactNode
}) {
  return (
    <select value={value} onChange={e => onChange(e.target.value)} style={{
      background: 'var(--input-bg)', border: '1px solid var(--border)', borderRadius: 8,
      padding: '8px 12px', color: 'var(--text-primary)',
      fontFamily: 'var(--font-body)', fontSize: 13,
    }}>
      {children}
    </select>
  )
}

// ─── Modal ────────────────────────────────────────────────────────────────────

export function Modal({ title, subtitle, onClose, children, maxWidth = 480 }: {
  title: string; subtitle?: string; onClose: () => void
  children: React.ReactNode; maxWidth?: number
}) {
  return (
    <div
      style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 1000,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div style={{
        background: 'var(--card-bg)', borderRadius: 16, padding: 28,
        width: '100%', maxWidth, boxShadow: '0 24px 64px rgba(0,0,0,0.4)',
        maxHeight: '90vh', overflowY: 'auto',
      }}>
        <div style={{
          fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 700,
          color: 'var(--text-primary)', marginBottom: subtitle ? 4 : 20,
        }}>{title}</div>
        {subtitle && (
          <div style={{
            fontSize: 13, color: 'var(--text-secondary)',
            marginBottom: 20, fontFamily: 'var(--font-body)',
          }}>{subtitle}</div>
        )}
        {children}
      </div>
    </div>
  )
}

// ─── InlineInput (usato nelle tabelle config) ─────────────────────────────────

export function InlineInput({ value, onChange, type = 'text' }: {
  value: string; onChange: (v: string) => void; type?: string
}) {
  return (
    <input type={type} value={value} onChange={e => onChange(e.target.value)} style={{
      background: 'var(--input-bg)', border: '1px solid var(--border)', borderRadius: 6,
      padding: '5px 8px', color: 'var(--text-primary)',
      fontFamily: 'var(--font-body)', fontSize: 13, width: '100%',
    }} />
  )
}