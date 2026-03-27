// Layout.tsx — TopBar + Sidebar shell
import { useEffect, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useAuthStore, useUIStore } from '../lib/store'
import { alertApi } from '../lib/api'

const NAV = [
  { path: '/dashboard', icon: '◈', label: 'Dashboard' },
  { path: '/feed',      icon: '◉', label: 'Threat Feed' },
  { path: '/ioc',       icon: '◎', label: 'IOC Manager' },
  { path: '/hunt',      icon: '◇', label: 'Threat Hunting' },
  { path: '/actors',    icon: '◆', label: 'Threat Actors' },
  { path: '/malware',   icon: '◈', label: 'Malware Intel' },
  { path: '/mitre',     icon: '◫', label: 'MITRE ATT&CK' },
  { path: '/darkweb',   icon: '◑', label: 'Dark Web Monitor' },
  { path: '/alerts',    icon: '◉', label: 'Alerts' },
  { path: '/reports',   icon: '◻', label: 'Reports' },
  { path: '/ai',        icon: '◈', label: 'AI Analysis' },
]

const TICKER_MSGS = [
  '▲ CRITICAL › New C2 infrastructure identified — 14 IPs blacklisted',
  '▲ HIGH › QakBot campaign targeting EMEA financial institutions',
  '▲ CRITICAL › CVE-2024-3400 exploited by Volt Typhoon actors',
  '▲ HIGH › APT29 spear-phishing targeting defense contractors',
  '▲ MEDIUM › Suspicious DNS tunneling activity from 185.220.x.x range',
  '▲ CRITICAL › ALPHV/BlackCat updated ransomware binary detected',
]

function TopBar() {
  const [time, setTime] = useState(new Date())
  const { username, role, clearAuth } = useAuthStore()
  const navigate = useNavigate()
  const openAlertCount = useUIStore(s => s.openAlertCount)

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(t)
  }, [])

  const logout = () => { clearAuth(); navigate('/login') }

  return (
    <div style={{
      height: 46, background: 'var(--bg1)', borderBottom: '1px solid var(--border)',
      display: 'flex', alignItems: 'center', gap: 16, padding: '0 16px', flexShrink: 0,
    }}>
      {/* Logo */}
      <div className="orbit" style={{
        color: 'var(--cyan)', fontSize: 15, fontWeight: 900, letterSpacing: 3,
        textShadow: '0 0 12px rgba(0,229,255,0.5)', whiteSpace: 'nowrap',
        animation: 'flicker 8s infinite',
      }}>
        ██ NEXUS CTI
      </div>

      {/* Ticker */}
      <div style={{ flex: 1, overflow: 'hidden', borderLeft: '1px solid var(--border)', borderRight: '1px solid var(--border)', padding: '0 12px', height: '100%', display: 'flex', alignItems: 'center' }}>
        <div style={{ overflow: 'hidden', width: '100%' }}>
          <div className="mono" style={{ fontSize: 11, color: 'var(--text2)', animation: 'ticker 35s linear infinite', whiteSpace: 'nowrap', display: 'inline-block' }}>
            {[...TICKER_MSGS, ...TICKER_MSGS].map((m, i) => (
              <span key={i} style={{ marginRight: 60 }}>{m}</span>
            ))}
          </div>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: 'flex', gap: 18, alignItems: 'center', flexShrink: 0 }}>
        {openAlertCount > 0 && (
          <div style={{ textAlign: 'center', cursor: 'pointer' }} onClick={() => navigate('/alerts')}>
            <div className="mono" style={{ fontSize: 15, fontWeight: 700, color: 'var(--red)' }}>{openAlertCount}</div>
            <div style={{ fontSize: 9, color: 'var(--text3)', letterSpacing: 1 }}>OPEN</div>
          </div>
        )}
        <div style={{ borderLeft: '1px solid var(--border)', paddingLeft: 14, display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
          <div className="mono" style={{ fontSize: 13, color: 'var(--cyan)' }}>{time.toLocaleTimeString()}</div>
          <div style={{ fontSize: 9, color: 'var(--text3)' }}>{time.toLocaleDateString()}</div>
        </div>
        <div style={{ borderLeft: '1px solid var(--border)', paddingLeft: 14 }}>
          <div style={{ fontSize: 11, color: 'var(--text2)' }}>{username}</div>
          <div className="mono" style={{ fontSize: 9, color: role === 'admin' ? 'var(--orange)' : 'var(--cyan)', letterSpacing: 1 }}>{role?.toUpperCase()}</div>
        </div>
        <button onClick={logout} style={{
          background: 'transparent', border: '1px solid var(--border)',
          color: 'var(--text3)', fontSize: 10, padding: '4px 8px', borderRadius: 3,
          cursor: 'pointer', fontFamily: "'Rajdhani',sans-serif", letterSpacing: 1,
        }}>
          LOGOUT
        </button>
      </div>
    </div>
  )
}

function Sidebar() {
  const location = useLocation()
  const navigate = useNavigate()
  const openAlertCount = useUIStore(s => s.openAlertCount)

  return (
    <div style={{ width: 196, background: 'var(--bg1)', borderRight: '1px solid var(--border)', display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
      <div style={{ flex: 1, overflowY: 'auto', padding: '6px 0' }}>
        {NAV.map(n => {
          const active = location.pathname === n.path
          return (
            <button key={n.path} onClick={() => navigate(n.path)}
              style={{
                display: 'flex', alignItems: 'center', gap: 10, width: '100%',
                padding: '9px 14px', background: active ? 'rgba(0,229,255,0.07)' : 'transparent',
                border: 'none', borderLeft: active ? '2px solid var(--cyan)' : '2px solid transparent',
                color: active ? 'var(--cyan)' : 'var(--text2)', cursor: 'pointer',
                fontSize: 13, fontFamily: "'Rajdhani',sans-serif", fontWeight: active ? 600 : 500,
                letterSpacing: 0.4, transition: 'all 0.12s', textAlign: 'left',
              }}
              onMouseEnter={e => { if (!active) (e.currentTarget as HTMLElement).style.color = 'var(--text)' }}
              onMouseLeave={e => { if (!active) (e.currentTarget as HTMLElement).style.color = 'var(--text2)' }}
            >
              <span style={{ fontSize: 13, opacity: 0.75 }}>{n.icon}</span>
              <span style={{ flex: 1 }}>{n.label}</span>
              {n.path === '/alerts' && openAlertCount > 0 && (
                <span className="mono" style={{
                  background: 'var(--red)', color: '#fff', borderRadius: 10,
                  padding: '1px 6px', fontSize: 9,
                }}>{openAlertCount}</span>
              )}
            </button>
          )
        })}
      </div>
      <div style={{ padding: '10px 14px', borderTop: '1px solid var(--border)' }}>
        {[['FEEDS', 'ACTIVE', 'var(--green)'], ['WORKERS', '4/4', 'var(--green)'], ['DB', 'ONLINE', 'var(--cyan)']].map(([k, v, c]) => (
          <div key={k} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, padding: '2px 0' }}>
            <span className="mono" style={{ color: 'var(--text3)' }}>{k}</span>
            <span className="mono" style={{ color: c }}>{v}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function Layout({ children }: { children: React.ReactNode }) {
  const setOpenAlertCount = useUIStore(s => s.setOpenAlertCount)

  // Poll open alert count
  useQuery({
    queryKey: ['alert-counts'],
    queryFn: async () => {
      const res = await alertApi.counts()
      const open = (res.data as any[])
        .filter((r: any) => r.status === 'open')
        .reduce((acc: number, r: any) => acc + r.count, 0)
      setOpenAlertCount(open)
      return open
    },
    refetchInterval: 30_000,
  })

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <TopBar />
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        <Sidebar />
        <div style={{ flex: 1, overflow: 'hidden', position: 'relative' }}>
          {children}
        </div>
      </div>
    </div>
  )
}
