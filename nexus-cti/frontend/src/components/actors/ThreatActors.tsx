// ThreatActors.tsx
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { actorApi } from '../../lib/api'
import { Tag, Card, SectionTitle, Spinner, SevBadge } from '../shared'

export default function ThreatActors() {
  const [selectedId, setSelectedId] = useState<number | null>(null)

  const { data: actors, isLoading } = useQuery({
    queryKey: ['actors'],
    queryFn: () => actorApi.list().then(r => r.data as any[]),
  })

  const { data: detail } = useQuery({
    queryKey: ['actor-detail', selectedId],
    queryFn: () => actorApi.get(selectedId!).then(r => r.data),
    enabled: selectedId != null,
  })

  const selected = actors?.find((a: any) => a.id === selectedId) ?? actors?.[0]

  if (isLoading) return <Spinner />

  return (
    <div style={{ display: 'flex', height: '100%', padding: 14, gap: 14 }}>
      {/* Actor list */}
      <div style={{ width: 260, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 8, overflowY: 'auto' }}>
        {(actors ?? []).map((a: any) => (
          <div key={a.id} onClick={() => setSelectedId(a.id)} className="card"
            style={{
              cursor: 'pointer', padding: 12, background: 'var(--bg2)', borderRadius: 6,
              border: selectedId === a.id ? `1px solid ${a.color}` : '1px solid var(--border)',
              transition: 'border-color 0.15s',
            }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
              <span style={{ fontWeight: 700, fontSize: 13, color: a.color }}>{a.name}</span>
              <span className="mono" style={{ fontSize: 11, color: a.color }}>{a.risk_score}</span>
            </div>
            <div style={{ fontSize: 11, color: 'var(--text2)', marginBottom: 6 }}>{a.origin} · {a.actor_type}</div>
            <div style={{ background: 'var(--bg0)', borderRadius: 2, height: 3 }}>
              <div style={{ width: `${a.risk_score}%`, height: '100%', background: a.color, borderRadius: 2 }} />
            </div>
          </div>
        ))}
      </div>

      {/* Detail */}
      {(detail ?? selected) && (
        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 12 }}>
          {/* Header card */}
          <Card className="fade-in" style={{ borderColor: (detail ?? selected)?.color }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
              <div>
                <div className="orbit" style={{ fontSize: 18, fontWeight: 700, color: (detail ?? selected)?.color, letterSpacing: 2 }}>
                  {(detail ?? selected)?.name}
                </div>
                <div style={{ fontSize: 12, color: 'var(--text2)', marginTop: 4 }}>
                  {(detail ?? selected)?.alias} · {(detail ?? selected)?.actor_type} · {(detail ?? selected)?.origin}
                </div>
                <div style={{ fontSize: 12, color: 'var(--text2)', marginTop: 6, lineHeight: 1.6 }}>
                  {(detail ?? selected)?.description}
                </div>
              </div>
              <div className="mono" style={{
                fontSize: 36, fontWeight: 700, color: (detail ?? selected)?.color,
                textShadow: `0 0 20px ${(detail ?? selected)?.color}40`,
                marginLeft: 20, flexShrink: 0,
              }}>
                {(detail ?? selected)?.risk_score}<span style={{ fontSize: 14, opacity: 0.5 }}>/100</span>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10 }}>
              {[
                ['Active Campaigns', (detail ?? selected)?.campaigns],
                ['TTPs Mapped', ((detail ?? selected)?.ttps ?? []).length],
                ['Risk Score', (detail ?? selected)?.risk_score],
              ].map(([k, v]) => (
                <div key={k as string} style={{ padding: 10, background: 'var(--bg3)', borderRadius: 4, textAlign: 'center' }}>
                  <div className="mono" style={{ fontSize: 20, fontWeight: 700, color: (detail ?? selected)?.color }}>{String(v)}</div>
                  <div style={{ fontSize: 10, color: 'var(--text3)', marginTop: 2 }}>{k as string}</div>
                </div>
              ))}
            </div>
          </Card>

          {/* TTPs */}
          <Card className="fade-in">
            <SectionTitle>KNOWN TTPs — MITRE ATT&CK</SectionTitle>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {((detail ?? selected)?.ttps ?? []).map((t: string) => (
                <Tag key={t} color="var(--cyan)">{t}</Tag>
              ))}
            </div>
          </Card>

          {/* Associated IOCs */}
          {detail?.associated_iocs?.length > 0 && (
            <Card className="fade-in">
              <SectionTitle>ASSOCIATED IOCs ({detail.associated_iocs.length})</SectionTitle>
              {detail.associated_iocs.map((ioc: any) => (
                <div key={ioc.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '7px 0', borderBottom: '1px solid var(--border)' }}>
                  <SevBadge sev={ioc.severity} />
                  <Tag color="var(--cyan)">{ioc.type}</Tag>
                  <span className="mono" style={{ fontSize: 11, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ioc.value}</span>
                  <span className="mono" style={{ fontSize: 10, color: ioc.score > 80 ? 'var(--red)' : 'var(--orange)' }}>{ioc.score}</span>
                </div>
              ))}
            </Card>
          )}
        </div>
      )}
    </div>
  )
}
