// Alerts.tsx
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import toast from 'react-hot-toast'
import { alertApi } from '../../lib/api'
import { SevBadge, Tag, Btn, Spinner, SectionTitle } from '../shared'
import { useUIStore } from '../../lib/store'

const STATUS_COLORS: Record<string, string> = {
  open: 'var(--red)',
  investigating: 'var(--orange)',
  resolved: 'var(--green)',
}

export default function Alerts() {
  const qc = useQueryClient()
  const setOpenAlertCount = useUIStore(s => s.setOpenAlertCount)
  const [sevFilter, setSev] = useState('')
  const [statusFilter, setStatus] = useState('')
  const [page, setPage] = useState(1)

  const { data, isLoading } = useQuery({
    queryKey: ['alerts', page, sevFilter, statusFilter],
    queryFn: async () => {
      const res = await alertApi.list({
        page, page_size: 15,
        severity: sevFilter || undefined,
        status: statusFilter || undefined,
      })
      return res.data
    },
    refetchInterval: 20_000,
  })

  const updateMut = useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) =>
      alertApi.update(id, { status }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['alerts'] })
      qc.invalidateQueries({ queryKey: ['alert-counts'] })
    },
  })

  const items: any[] = data?.items ?? []

  // Summary counts
  const openCount = items.filter(a => a.status === 'open').length
  const invCount  = items.filter(a => a.status === 'investigating').length
  const resCount  = items.filter(a => a.status === 'resolved').length

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', padding: 14, gap: 10 }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
        <div style={{ display: 'flex', align: 'center', gap: 16 }}>
          <span className="orbit" style={{ color: 'var(--orange)', fontSize: 13, letterSpacing: 2 }}>ALERT MANAGEMENT</span>
          <span className="mono" style={{ fontSize: 11, color: 'var(--red)', marginLeft: 16 }}>OPEN: {openCount}</span>
          <span className="mono" style={{ fontSize: 11, color: 'var(--orange)', marginLeft: 10 }}>INVESTIGATING: {invCount}</span>
          <span className="mono" style={{ fontSize: 11, color: 'var(--green)', marginLeft: 10 }}>RESOLVED: {resCount}</span>
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          <select value={sevFilter} onChange={e => { setSev(e.target.value); setPage(1) }} style={{ width: 120 }}>
            <option value="">All Severity</option>
            {['critical','high','medium','low'].map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase()+s.slice(1)}</option>)}
          </select>
          <select value={statusFilter} onChange={e => { setStatus(e.target.value); setPage(1) }} style={{ width: 130 }}>
            <option value="">All Status</option>
            {['open','investigating','resolved'].map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase()+s.slice(1)}</option>)}
          </select>
        </div>
      </div>

      {/* Alert list */}
      {isLoading ? <Spinner /> : (
        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8 }}>
          {items.map(a => (
            <div key={a.id}
              className="fade-in"
              style={{
                padding: '12px 14px', background: 'var(--bg2)', borderRadius: 6,
                border: `1px solid var(--border)`,
                borderLeft: `3px solid ${STATUS_COLORS[a.status] ?? 'var(--text3)'}`,
                opacity: a.status === 'resolved' ? 0.65 : 1,
              }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, flexWrap: 'wrap' }}>
                    <SevBadge sev={a.severity} />
                    <Tag color="var(--cyan)">{a.category}</Tag>
                    <span className="mono" style={{ fontSize: 9, color: 'var(--text3)' }}>#{a.id}</span>
                  </div>
                  <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 4 }}>{a.title}</div>
                  <div style={{ fontSize: 12, color: 'var(--text2)', lineHeight: 1.5 }}>{a.description}</div>
                </div>
                <div style={{ textAlign: 'right', marginLeft: 16, flexShrink: 0 }}>
                  <div className="mono" style={{ fontSize: 10, color: 'var(--text3)', marginBottom: 3 }}>
                    {new Date(a.timestamp).toLocaleString()}
                  </div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: STATUS_COLORS[a.status] ?? 'var(--text2)' }}>
                    {a.status.toUpperCase()}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 2 }}>→ {a.assignee}</div>
                </div>
              </div>
              {a.status !== 'resolved' && (
                <div style={{ display: 'flex', gap: 6, marginTop: 10, flexWrap: 'wrap' }}>
                  {a.status === 'open' && (
                    <Btn onClick={() => { updateMut.mutate({ id: a.id, status: 'investigating' }); toast.success('Moved to Investigating') }}>
                      INVESTIGATE
                    </Btn>
                  )}
                  <Btn variant="success" onClick={() => { updateMut.mutate({ id: a.id, status: 'resolved' }); toast.success('Alert resolved') }}>
                    RESOLVE
                  </Btn>
                  <Btn variant="danger">ESCALATE</Btn>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span className="mono" style={{ fontSize: 11, color: 'var(--text3)' }}>Page {page} · {data?.total ?? 0} total</span>
        <div style={{ display: 'flex', gap: 6 }}>
          <Btn onClick={() => setPage(p => Math.max(1, p-1))} disabled={page <= 1}>PREV</Btn>
          <Btn onClick={() => setPage(p => p+1)} disabled={(data?.total ?? 0) <= page * 15}>NEXT</Btn>
        </div>
      </div>
    </div>
  )
}
