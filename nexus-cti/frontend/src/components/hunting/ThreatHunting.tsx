// ThreatHunting.tsx
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { huntApi } from '../../lib/api'
import { SevBadge, Tag, Btn, Card, SectionTitle, Empty, Spinner } from '../shared'

const PRESETS = [
  'type:ip severity:critical',
  'type:domain tag:phishing',
  'severity:critical',
  'actor:APT',
  'type:hash tag:ransomware',
  'score:85',
]

const TYPE_COLORS: Record<string, string> = { ip: 'var(--cyan)', domain: 'var(--purple)', hash: 'var(--orange)', url: 'var(--green)' }

export default function ThreatHunting() {
  const [query, setQuery]       = useState('')
  const [submitted, setSubmit]  = useState('')
  const [pivotId, setPivotId]   = useState<number | null>(null)

  // Parse query into params
  const parseQuery = (q: string) => {
    const params: Record<string, string> = { q }
    q.split(' ').forEach(part => {
      const [k, v] = part.split(':')
      if (v) {
        if (k === 'type') params.ioc_type = v
        if (k === 'severity') params.severity = v
        if (k === 'actor') params.actor = v
        if (k === 'score') params.min_score = v
      }
    })
    return params
  }

  const { data: results, isFetching } = useQuery({
    queryKey: ['hunt', submitted],
    queryFn: () => huntApi.search(parseQuery(submitted)).then(r => r.data),
    enabled: !!submitted,
  })

  const { data: pivot } = useQuery({
    queryKey: ['pivot', pivotId],
    queryFn: () => huntApi.pivot(pivotId!).then(r => r.data),
    enabled: pivotId != null,
  })

  const { data: timeline } = useQuery({
    queryKey: ['hunt-timeline'],
    queryFn: () => huntApi.timeline(14).then(r => r.data),
  })

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: 14, gap: 10 }}>
      {/* Query Bar */}
      <Card style={{ padding: '10px 12px' }}>
        <SectionTitle>HUNT QUERY — DSL SEARCH</SectionTitle>
        <div style={{ display: 'flex', gap: 8 }}>
          <input value={query} onChange={e => setQuery(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && setSubmit(query)}
            placeholder="type:ip severity:critical | actor:APT29 | score:80 | type:domain tag:phishing"
            style={{ flex: 1, fontFamily: "'Share Tech Mono', monospace", fontSize: 12 }} />
          <Btn onClick={() => setSubmit(query)}>EXECUTE</Btn>
          <Btn variant="ghost" onClick={() => { setQuery(''); setSubmit(''); setPivotId(null) }}>CLEAR</Btn>
        </div>
        <div style={{ marginTop: 8, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {PRESETS.map(p => (
            <span key={p} onClick={() => { setQuery(p); setSubmit(p) }}
              className="mono"
              style={{ fontSize: 10, color: 'var(--cyan)', cursor: 'pointer', padding: '2px 7px', border: '1px solid rgba(0,229,255,0.2)', borderRadius: 3 }}>
              {p}
            </span>
          ))}
        </div>
      </Card>

      {/* Results + Pivot */}
      <div style={{ flex: 1, display: 'flex', gap: 10, minHeight: 0 }}>
        {/* Results */}
        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 4 }}>
          {isFetching && <Spinner />}
          {!submitted && !isFetching && <Empty icon="◇" label="Execute a hunt query to investigate threats" />}
          {results?.results?.map((r: any) => (
            <div key={r.id}
              onClick={() => setPivotId(r.id)}
              className="fade-in"
              style={{
                padding: '9px 12px', background: pivotId === r.id ? 'rgba(0,229,255,0.07)' : 'var(--bg2)',
                borderRadius: 4, border: `1px solid ${pivotId === r.id ? 'var(--cyan)' : 'var(--border)'}`,
                cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10,
              }}>
              <SevBadge sev={r.severity} />
              <Tag color={TYPE_COLORS[r.type] ?? 'var(--cyan)'}>{r.type}</Tag>
              <span className="mono" style={{ fontSize: 11, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.value}</span>
              <span className="mono" style={{ fontSize: 10, color: r.score > 80 ? 'var(--red)' : 'var(--orange)' }}>score: {r.score}</span>
            </div>
          ))}
          {results && results.count === 0 && <Empty icon="◎" label="No IOCs match this query" />}
        </div>

        {/* Pivot panel */}
        {pivot && (
          <div className="slide-right" style={{ width: 280, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
            <Card style={{ overflow: 'hidden' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                <SectionTitle>PIVOT INVESTIGATION</SectionTitle>
                <button onClick={() => setPivotId(null)} style={{ background: 'none', border: 'none', color: 'var(--text3)', cursor: 'pointer' }}>✕</button>
              </div>
              {[
                ['Type', pivot.ioc?.type?.toUpperCase(), 'var(--cyan)'],
                ['Severity', pivot.ioc?.severity, `var(--sev-${pivot.ioc?.severity}-color, var(--cyan))`],
                ['Score', pivot.ioc?.score, pivot.ioc?.score > 80 ? 'var(--red)' : 'var(--orange)'],
                ['Actor', pivot.ioc?.actor || '—', 'var(--orange)'],
                ['Country', pivot.ioc?.country || '—', 'var(--text2)'],
                ['Hits', pivot.ioc?.hits, 'var(--cyan)'],
                ['Source', pivot.ioc?.source || '—', 'var(--text2)'],
              ].map(([k, v, c]) => (
                <div key={k as string} style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border)', paddingBottom: 5, marginBottom: 5 }}>
                  <span style={{ fontSize: 11, color: 'var(--text3)' }}>{k as string}</span>
                  <span className="mono" style={{ fontSize: 11, color: c as string }}>{String(v)}</span>
                </div>
              ))}
              <div style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 4 }}>Value</div>
              <div className="mono" style={{ fontSize: 10, wordBreak: 'break-all', padding: 8, background: 'var(--bg3)', borderRadius: 4 }}>
                {pivot.ioc?.value}
              </div>
              <div style={{ display: 'flex', gap: 6, marginTop: 10, flexWrap: 'wrap' }}>
                <Btn variant="danger" style={{ fontSize: 10 }}>BLOCK IOC</Btn>
                <Btn style={{ fontSize: 10 }}>CREATE ALERT</Btn>
              </div>
            </Card>

            {pivot.related?.length > 0 && (
              <Card>
                <SectionTitle>RELATED IOCS ({pivot.related.length})</SectionTitle>
                {pivot.related.map((r: any) => (
                  <div key={r.id} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 0', borderBottom: '1px solid var(--border)' }}>
                    <SevBadge sev={r.severity} />
                    <span className="mono" style={{ fontSize: 10, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.value}</span>
                  </div>
                ))}
              </Card>
            )}
          </div>
        )}
      </div>

      {/* Timeline */}
      {timeline && (
        <Card style={{ padding: '8px 6px', flexShrink: 0 }}>
          <SectionTitle>ACTIVITY TIMELINE — 14 DAYS</SectionTitle>
          <ResponsiveContainer width="100%" height={70}>
            <BarChart data={timeline} margin={{ top: 0, right: 0, bottom: 0, left: -28 }}>
              <XAxis dataKey="date" tick={{ fill: '#4a5f78', fontSize: 9 }} tickLine={false} interval={2} />
              <YAxis tick={false} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: 'var(--bg3)', border: '1px solid var(--border2)', fontSize: 11 }} />
              <Bar dataKey="critical" stackId="a" fill="#ff1744" />
              <Bar dataKey="high"     stackId="a" fill="#ff9100" />
              <Bar dataKey="medium"   stackId="a" fill="#ffea00" radius={[2,2,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      )}
    </div>
  )
}
