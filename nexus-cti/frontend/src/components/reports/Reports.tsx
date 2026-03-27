// Reports.tsx
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { reportApi } from '../../lib/api'
import { SevBadge, Btn, Card, SectionTitle, Spinner, Tag } from '../shared'

export default function Reports() {
  const qc = useQueryClient()
  const [reportType, setReportType] = useState('executive')
  const [activeReport, setActiveReport] = useState<any>(null)
  const [viewId, setViewId] = useState<number | null>(null)

  const { data: reports, isLoading } = useQuery({
    queryKey: ['reports'],
    queryFn: () => reportApi.list().then(r => r.data as any[]),
  })

  const { data: fullReport } = useQuery({
    queryKey: ['report', viewId],
    queryFn: () => reportApi.get(viewId!).then(r => r.data),
    enabled: viewId != null,
  })

  const genMut = useMutation({
    mutationFn: () => reportApi.generate({ report_type: reportType }),
    onSuccess: (res) => {
      setActiveReport(res.data)
      qc.invalidateQueries({ queryKey: ['reports'] })
      toast.success('Report generated')
    },
    onError: () => toast.error('Failed to generate report'),
  })

  const displayReport = viewId && fullReport ? fullReport : activeReport
  const today = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })

  return (
    <div style={{ display: 'flex', height: '100%', padding: 14, gap: 12 }}>
      {/* Left — controls + history */}
      <div style={{ width: 260, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
        <Card>
          <SectionTitle>GENERATE REPORT</SectionTitle>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <select value={reportType} onChange={e => setReportType(e.target.value)} style={{ width: '100%' }}>
              <option value="executive">Executive Summary</option>
              <option value="campaign">Campaign Analysis</option>
              <option value="ioc">IOC Intelligence</option>
              <option value="actor">Threat Actor Profile</option>
            </select>
            <Btn variant="success" onClick={() => genMut.mutate()} disabled={genMut.isPending}>
              {genMut.isPending ? 'GENERATING…' : 'GENERATE'}
            </Btn>
            {displayReport && (
              <>
                <Btn onClick={() => {
                  const blob = new Blob([JSON.stringify(displayReport.content, null, 2)], { type: 'application/json' })
                  const url = URL.createObjectURL(blob)
                  const a = document.createElement('a')
                  a.href = url; a.download = `nexus-report-${Date.now()}.json`; a.click()
                  toast.success('Exported as JSON')
                }}>EXPORT JSON</Btn>
              </>
            )}
          </div>
        </Card>

        {/* Report history */}
        <Card style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          <SectionTitle>REPORT HISTORY</SectionTitle>
          {isLoading ? <Spinner /> : (
            <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 6 }}>
              {(reports ?? []).map((r: any) => (
                <div key={r.id}
                  onClick={() => { setViewId(r.id); setActiveReport(null) }}
                  style={{
                    padding: '8px 10px', background: 'var(--bg3)', borderRadius: 4,
                    border: `1px solid ${viewId === r.id ? 'var(--cyan)' : 'var(--border)'}`,
                    cursor: 'pointer',
                  }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)', marginBottom: 2 }}>{r.title}</div>
                  <div style={{ fontSize: 10, color: 'var(--text3)' }}>
                    {new Date(r.created_at).toLocaleDateString()} · {r.generated_by}
                  </div>
                </div>
              ))}
              {!reports?.length && <div style={{ fontSize: 12, color: 'var(--text3)', textAlign: 'center', padding: 16 }}>No reports yet</div>}
            </div>
          )}
        </Card>
      </div>

      {/* Right — report view */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {genMut.isPending && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', flexDirection: 'column', gap: 10 }}>
            <span className="blink" style={{ fontSize: 32, color: 'var(--cyan)', opacity: 0.4 }}>◈</span>
            <div className="mono" style={{ fontSize: 12, color: 'var(--text3)' }}>Correlating threat intelligence…</div>
          </div>
        )}
        {displayReport && !genMut.isPending && <ReportView report={displayReport} today={today} />}
        {!displayReport && !genMut.isPending && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', flexDirection: 'column', gap: 10 }}>
            <div style={{ fontSize: 48, opacity: 0.1 }}>◻</div>
            <div style={{ fontSize: 13, color: 'var(--text3)' }}>Select a report type and click Generate</div>
          </div>
        )}
      </div>
    </div>
  )
}

function ReportView({ report, today }: { report: any; today: string }) {
  const c = report.content ?? {}
  return (
    <Card style={{ maxWidth: 820 }}>
      {/* Title page */}
      <div style={{ textAlign: 'center', padding: '24px 0 20px', borderBottom: '1px solid var(--border)', marginBottom: 24 }}>
        <div className="orbit" style={{ fontSize: 20, fontWeight: 900, color: 'var(--cyan)', letterSpacing: 4, marginBottom: 6 }}>
          NEXUS CTI PLATFORM
        </div>
        <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 4 }}>
          {report.title || 'Cyber Threat Intelligence Report'}
        </div>
        <div style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 10 }}>
          {today} · Analyst: {c.generated_by || report.generated_by || 'System'}
        </div>
        <div style={{ display: 'inline-flex', gap: 8 }}>
          <Tag color="var(--red)">TLP:RED</Tag>
          <Tag color="var(--cyan)">CLASSIFICATION: RESTRICTED</Tag>
        </div>
      </div>

      {/* Executive Summary */}
      <div style={{ marginBottom: 24 }}>
        <SectionTitle>1. EXECUTIVE SUMMARY</SectionTitle>
        <div style={{ fontSize: 13, color: 'var(--text)', lineHeight: 1.8, marginBottom: 12 }}>
          During the reporting period, the NEXUS CTI platform identified{' '}
          <strong style={{ color: 'var(--red)' }}>{c.executive_summary?.critical_iocs ?? '—'} critical-severity</strong>{' '}
          indicators of compromise and tracked{' '}
          <strong style={{ color: 'var(--orange)' }}>{c.executive_summary?.open_alerts ?? '—'} open alerts</strong>.
          The overall environment threat score is elevated at{' '}
          <strong style={{ color: 'var(--red)' }}>{c.executive_summary?.threat_score ?? '—'}/10</strong>.
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10 }}>
          {[
            ['Critical IOCs', c.executive_summary?.critical_iocs, 'var(--red)'],
            ['Open Alerts', c.executive_summary?.open_alerts, 'var(--orange)'],
            ['Risk Level', c.executive_summary?.risk_level ?? 'HIGH', 'var(--red)'],
          ].map(([k, v, col]) => (
            <div key={k as string} style={{ padding: 10, background: 'var(--bg3)', borderRadius: 4, textAlign: 'center' }}>
              <div className="mono" style={{ fontSize: 20, fontWeight: 700, color: col as string }}>{String(v)}</div>
              <div style={{ fontSize: 10, color: 'var(--text3)' }}>{k as string}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Key Findings */}
      <div style={{ marginBottom: 24 }}>
        <SectionTitle>2. KEY FINDINGS</SectionTitle>
        {(c.key_findings ?? []).map((f: any, i: number) => (
          <div key={i} style={{ display: 'flex', gap: 10, padding: '8px 0', borderBottom: '1px solid var(--border)', alignItems: 'flex-start' }}>
            <SevBadge sev={f.severity} />
            <span style={{ fontSize: 13 }}>{f.text}</span>
          </div>
        ))}
      </div>

      {/* Top Actors */}
      {c.top_actors?.length > 0 && (
        <div style={{ marginBottom: 24 }}>
          <SectionTitle>3. TOP THREAT ACTORS</SectionTitle>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10 }}>
            {c.top_actors.map((a: any) => (
              <div key={a.name} style={{ padding: 10, background: 'var(--bg3)', borderRadius: 4, border: '1px solid var(--border)' }}>
                <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--cyan)', marginBottom: 3 }}>{a.name}</div>
                <div style={{ fontSize: 11, color: 'var(--text2)' }}>{a.origin}</div>
                <div className="mono" style={{ fontSize: 11, color: 'var(--red)', marginTop: 4 }}>Risk: {a.risk_score}/100</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Critical IOCs */}
      {c.critical_iocs?.length > 0 && (
        <div style={{ marginBottom: 24 }}>
          <SectionTitle>4. TOP CRITICAL IOCs</SectionTitle>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border2)' }}>
                {['Type','Indicator','Actor','Score','First Seen'].map(h => (
                  <th key={h} style={{ padding: '5px 8px', textAlign: 'left', color: 'var(--text3)', fontSize: 10, textTransform: 'uppercase' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {c.critical_iocs.map((ioc: any, i: number) => (
                <tr key={i} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '6px 8px' }}><Tag color="var(--cyan)">{ioc.type?.toUpperCase()}</Tag></td>
                  <td className="mono" style={{ padding: '6px 8px', fontSize: 10, maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ioc.value}</td>
                  <td style={{ padding: '6px 8px', fontSize: 11, color: 'var(--text2)' }}>{ioc.actor?.split('/')[0]}</td>
                  <td className="mono" style={{ padding: '6px 8px', color: 'var(--red)' }}>{ioc.score}</td>
                  <td className="mono" style={{ padding: '6px 8px', fontSize: 10, color: 'var(--text3)' }}>
                    {ioc.first_seen ? new Date(ioc.first_seen).toLocaleDateString() : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Recommendations */}
      <div>
        <SectionTitle>5. RECOMMENDATIONS</SectionTitle>
        {(c.recommendations ?? []).map((r: string, i: number) => (
          <div key={i} style={{ display: 'flex', gap: 10, padding: '7px 0', borderBottom: '1px solid var(--border)', alignItems: 'flex-start' }}>
            <span className="mono" style={{ color: 'var(--green)', flexShrink: 0, fontSize: 11 }}>▶</span>
            <span style={{ fontSize: 13 }}>{r}</span>
          </div>
        ))}
      </div>
    </Card>
  )
}
