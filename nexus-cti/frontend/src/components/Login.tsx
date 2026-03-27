// Login.tsx
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { authApi } from '../lib/api'
import { useAuthStore } from '../lib/store'
import toast from 'react-hot-toast'

export default function Login() {
  const [username, setUsername] = useState('admin')
  const [password, setPassword] = useState('admin123')
  const [loading, setLoading] = useState(false)
  const setAuth = useAuthStore((s) => s.setAuth)
  const navigate = useNavigate()

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await authApi.login(username, password)
      setAuth(res.data.access_token, res.data.username, res.data.role)
      navigate('/dashboard')
    } catch {
      toast.error('Invalid credentials')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'var(--bg0)',
    }}>
      <div style={{
        width: 380, background: 'var(--bg2)',
        border: '1px solid var(--border2)', borderRadius: 8,
        padding: '40px 36px', position: 'relative', overflow: 'hidden',
      }}>
        {/* top glow */}
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: 1,
          background: 'linear-gradient(90deg,transparent,var(--cyan),transparent)',
        }} />

        <div className="orbit" style={{
          fontSize: 22, fontWeight: 900, color: 'var(--cyan)',
          letterSpacing: 4, textAlign: 'center', marginBottom: 4,
          textShadow: '0 0 18px rgba(0,229,255,0.5)',
          animation: 'flicker 8s infinite',
        }}>
          ██ NEXUS CTI
        </div>
        <div style={{ textAlign: 'center', fontSize: 11, color: 'var(--text3)', letterSpacing: 2, marginBottom: 32 }}>
          CYBER THREAT INTELLIGENCE PLATFORM
        </div>

        <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <div style={{ fontSize: 10, color: 'var(--text3)', letterSpacing: 1, marginBottom: 5 }}>USERNAME</div>
            <input
              value={username} onChange={e => setUsername(e.target.value)}
              style={{ width: '100%' }} autoComplete="username"
            />
          </div>
          <div>
            <div style={{ fontSize: 10, color: 'var(--text3)', letterSpacing: 1, marginBottom: 5 }}>PASSWORD</div>
            <input
              type="password" value={password} onChange={e => setPassword(e.target.value)}
              style={{ width: '100%' }} autoComplete="current-password"
            />
          </div>
          <button
            type="submit" disabled={loading}
            style={{
              marginTop: 8, padding: '10px', background: 'rgba(0,229,255,0.08)',
              border: '1px solid var(--border2)', borderRadius: 4,
              color: 'var(--cyan)', fontFamily: "'Orbitron', monospace",
              fontSize: 12, fontWeight: 700, letterSpacing: 3, cursor: 'pointer',
              transition: 'all 0.2s', opacity: loading ? 0.6 : 1,
            }}
          >
            {loading ? 'AUTHENTICATING...' : 'ACCESS PLATFORM'}
          </button>
        </form>

        <div style={{ marginTop: 24, padding: '10px 12px', background: 'var(--bg3)', borderRadius: 4, border: '1px solid var(--border)' }}>
          <div style={{ fontSize: 10, color: 'var(--text3)', marginBottom: 4 }}>DEFAULT CREDENTIALS</div>
          <div className="mono" style={{ fontSize: 11, color: 'var(--text2)' }}>admin / admin123 · analyst / analyst123</div>
        </div>
      </div>
    </div>
  )
}
