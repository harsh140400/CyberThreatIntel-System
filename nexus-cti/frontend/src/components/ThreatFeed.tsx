// ThreatFeed.tsx — live feed with WebSocket real-time updates
import { useState, useEffect, useRef } from 'react'
import { useQuery } from '@tanstack/react-query'
import { feedApi } from '../lib/api'
import { SevBadge, Btn, Spinner } from './shared'

interface FeedItem {
  id: number
  message: string
  severity: string
  source: string
  timestamp: string
}

export default function ThreatFeed() {
  const [filter, setFilter] = useState('all')
  const [liveItems, setLiveItems] = useState<FeedItem[]>([])
  const wsRef = useRef<WebSocket | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: ['feed', filter],
    queryFn: () => feedApi.list({ severity: filter === 'all' ? undefined : filter, page_size: 60 }).then(r => r.data),
  })

  // WebSocket connection for live updates
  useEffect(() => {
    const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws'
    const ws = new WebSocket(`${protocol}://${window.location.host}/api/feed/ws`)
    wsRef.current = ws

    ws.onmessage = (e) => {
      try {
        const item: FeedItem = JSON.parse(e.data)
        if (filter === 'all' || item.severity === filter) {
          setLiveItems(prev => [item, ...prev].slice(0, 20))
        }
      } catch {}
    }
    return () => ws.close()
  }, [filter])

  const allItems = [...liveItems, ...(data?.items ?? [])]
  const filtered = filter === 'all' ? allItems : allItems.filter(f => f.severity === filter)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: 14, gap: 10 }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span className="blink" style={{ color: 'var(--red)', fontSize: 10 }}>●</span>
          <span className="orbit" style={{ color: 'var(--cyan)', fontSize: 13, letterSpacing: 2 }}>LIVE THREAT FEED</span>
          <span className="mono" style={{ fontSize: 10, color: 'var(--text3)' }}>WebSocket · auto-refresh</span>
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          {['all','critical','high','medium','low'].map(s => (
            <Btn key={s} onClick={() => setFilter(s)}
              style={filter === s ? { background: 'rgba(0,229,255,0.1)', borderColor: 'var(--cyan)' } : {}}
            >
              {s.toUpperCase()}
            </Btn>
          ))}
        </div>
      </div>

      {/* Feed List */}
      {isLoading ? <Spinner /> : (
        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 4 }}>
          {filtered.map((f, i) => {
            const sevColors: Record<string, string> = {
              critical: 'var(--red)', high: 'var(--orange)',
              medium: 'var(--yellow)', low: 'var(--green)',
            }
            const borderColor = sevColors[f.severity] ?? 'var(--cyan)'
            return (
              <div key={`${f.id}-${i}`} className={i < liveItems.length ? 'fade-in' : ''}
                style={{
                  padding: '9px 12px', background: 'var(--bg2)', borderRadius: 4,
                  border: `1px solid rgba(255,255,255,0.05)`,
                  borderLeft: `3px solid ${borderColor}`,
                  display: 'flex', alignItems: 'center', gap: 10,
                }}>
                <SevBadge sev={f.severity} />
                <span style={{ flex: 1, fontSize: 13 }}>{f.message}</span>
                <span className="mono" style={{ fontSize: 10, color: 'var(--text3)', whiteSpace: 'nowrap' }}>{f.source}</span>
                <span className="mono" style={{ fontSize: 10, color: 'var(--text3)', whiteSpace: 'nowrap' }}>
                  {new Date(f.timestamp).toLocaleTimeString()}
                </span>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
