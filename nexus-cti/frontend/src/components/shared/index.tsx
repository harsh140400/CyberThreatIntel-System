// components/shared/index.tsx — reusable UI primitives
import React from 'react'

// ── Severity helpers ──────────────────────────────────────────────────────────
export const SEV: Record<string, { color: string; bg: string; border: string }> = {
  critical: { color: '#ff1744', bg: 'rgba(255,23,68,0.14)',   border: 'rgba(255,23,68,0.38)' },
  high:     { color: '#ff9100', bg: 'rgba(255,145,0,0.14)',   border: 'rgba(255,145,0,0.38)' },
  medium:   { color: '#ffea00', bg: 'rgba(255,234,0,0.10)',   border: 'rgba(255,234,0,0.30)' },
  low:      { color: '#00e676', bg: 'rgba(0,230,118,0.10)',   border: 'rgba(0,230,118,0.28)' },
}

// ── SevBadge ──────────────────────────────────────────────────────────────────
export function SevBadge({ sev }: { sev: string }) {
  const s = SEV[sev] ?? SEV.low
  return (
    <span
      className="mono"
      style={{
        display: 'inline-block', padding: '2px 7px', borderRadius: 3,
        fontSize: 10, fontWeight: 600, letterSpacing: 0.5, textTransform: 'uppercase',
        color: s.color, background: s.bg, border: `1px solid ${s.border}`,
        whiteSpace: 'nowrap',
      }}
    >
      {sev}
    </span>
  )
}

// ── Card ──────────────────────────────────────────────────────────────────────
export function Card({
  children, style, className = '',
}: { children: React.ReactNode; style?: React.CSSProperties; className?: string }) {
  return (
    <div
      className={className}
      style={{
        background: 'var(--bg2)', border: '1px solid var(--border)',
        borderRadius: 6, padding: 16, position: 'relative', overflow: 'hidden',
        ...style,
      }}
    >
      {/* top accent line */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: 1,
        background: 'linear-gradient(90deg,transparent,rgba(0,229,255,0.35),transparent)',
      }} />
      {children}
    </div>
  )
}

// ── MetricCard ────────────────────────────────────────────────────────────────
export function MetricCard({
  title, value, sub, color = 'var(--cyan)', trend,
}: {
  title: string; value: React.ReactNode; sub?: string
  color?: string; trend?: number
}) {
  return (
    <Card className="fade-in" style={{ minWidth: 0 }}>
      <div style={{ fontSize: 10, color: 'var(--text3)', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 8 }}>
        {title}
      </div>
      <div className="mono" style={{ fontSize: 26, fontWeight: 700, color, lineHeight: 1 }}>{value}</div>
      {sub && <div style={{ fontSize: 11, color: 'var(--text2)', marginTop: 4 }}>{sub}</div>}
      {trend !== undefined && (
        <div style={{ fontSize: 11, color: trend > 0 ? 'var(--red)' : 'var(--green)', marginTop: 4 }}>
          {trend > 0 ? '▲' : '▼'} {Math.abs(trend)}% vs last 7d
        </div>
      )}
    </Card>
  )
}

// ── Btn ───────────────────────────────────────────────────────────────────────
type BtnVariant = 'default' | 'danger' | 'success' | 'ghost'
export function Btn({
  children, onClick, disabled, variant = 'default', style, className = '',
}: {
  children: React.ReactNode
  onClick?: () => void
  disabled?: boolean
  variant?: BtnVariant
  style?: React.CSSProperties
  className?: string
}) {
  const variantStyles: Record<BtnVariant, React.CSSProperties> = {
    default: { borderColor: 'var(--border2)', color: 'var(--cyan)' },
    danger:  { borderColor: 'rgba(255,23,68,0.45)', color: 'var(--red)' },
    success: { borderColor: 'rgba(0,230,118,0.45)', color: 'var(--green)' },
    ghost:   { borderColor: 'var(--border)', color: 'var(--text2)' },
  }
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={className}
      style={{
        background: 'transparent', border: '1px solid', borderRadius: 3,
        fontFamily: "'Rajdhani', sans-serif", fontWeight: 600,
        fontSize: 11, padding: '5px 12px', cursor: disabled ? 'not-allowed' : 'pointer',
        letterSpacing: 1, textTransform: 'uppercase', transition: 'all 0.15s',
        opacity: disabled ? 0.45 : 1,
        ...variantStyles[variant],
        ...style,
      }}
      onMouseEnter={(e) => {
        if (!disabled) (e.currentTarget as HTMLElement).style.background = 'rgba(0,229,255,0.07)'
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.background = 'transparent'
      }}
    >
      {children}
    </button>
  )
}

// ── SectionTitle ──────────────────────────────────────────────────────────────
export function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ fontSize: 10, color: 'var(--text3)', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 10 }}>
      {children}
    </div>
  )
}

// ── Tag ───────────────────────────────────────────────────────────────────────
export function Tag({ children, color = 'var(--cyan)' }: { children: React.ReactNode; color?: string }) {
  return (
    <span
      className="mono"
      style={{
        display: 'inline-block', padding: '2px 7px', borderRadius: 3,
        fontSize: 10, letterSpacing: 0.5,
        color, background: `${color}18`, border: `1px solid ${color}45`,
      }}
    >
      {children}
    </span>
  )
}

// ── Spinner ───────────────────────────────────────────────────────────────────
export function Spinner() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: 24, color: 'var(--text3)', fontSize: 13 }}>
      <span className="blink" style={{ color: 'var(--cyan)' }}>●</span>
      Loading…
    </div>
  )
}

// ── Empty ─────────────────────────────────────────────────────────────────────
export function Empty({ icon = '◇', label }: { icon?: string; label: string }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 10, minHeight: 120 }}>
      <div style={{ fontSize: 36, opacity: 0.15 }}>{icon}</div>
      <div style={{ fontSize: 13, color: 'var(--text3)' }}>{label}</div>
    </div>
  )
}
