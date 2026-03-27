// IOCManager.tsx
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { iocApi } from '../../lib/api'
import { SevBadge, Tag, Btn, Spinner, Card, SectionTitle } from '../shared'

const TYPE_COLORS: Record<string, string> = {
  ip: 'var(--cyan)', domain: 'var(--purple)',
  hash: 'var(--orange)', url: 'var(--green)',
}

export default function IOCManager() {
  const qc = useQueryClient()
  const [search, setSearch]     = useState('')
  const [typeFilter, setType]   = useState('')
  const [sevFilter, setSev]     = useState('')
  const [page, setPage]         = useState(1)
  const [selected, setSelected] = useState<any>(null)
  const [showAdd, setShowAdd]   = useState(false)

  const { data, isLoading } = useQuery({
    queryKey: ['iocs', page, search, typeFilter, sevFilter],
    queryFn: () => iocApi.list({
      page, page_size: 20,
      search: search || undefined,
      ioc_type: typeFilter || undefined,
      severity: sevFilter || undefined,
    }).then(r => r.data),
    placeholderData: (prev: any) => prev,
  })

  const deleteMut = useMutation({
    mutationFn: (id: number) => iocApi.delete(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['iocs'] }); toast.success('IOC removed'); setSelected(null) },
  })

  const updateMut = useMutation({
    mutationFn: ({ id, data }: { id: number; data: object }) => iocApi.update(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['iocs'] }); toast.success('IOC updated') },
  })

  const items: any[] = data?.items ?? []
  const pages: number = data?.pages ?? 1

  return (
    <div style={{ display: 'flex', height: '100%' }}>
      {/* Main Table */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: 14, gap: 10, minWidth: 0 }}>
        {/* Filters */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
          <input placeholder="Search value, actor, tag…" value={search}
            onChange={e => { setSearch(e.target.value); setPage(1) }}
            style={{ flex: 1, minWidth: 180 }} />
          <select value={typeFilter} onChange={e => { setType(e.target.value); setPage(1) }} style={{ width: 130 }}>
            <option value="">All Types</option>
            {['ip','domain','hash','url'].map(t => <option key={t} value={t}>{t.toUpperCase()}</option>)}
          </select>
          <select value={sevFilter} onChange={e => { setSev(e.target.value); setPage(1) }} style={{ width: 130 }}>
            <option value="">All Severities</option>
            {['critical','high','medium','low'].map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase()+s.slice(1)}</option>)}
          </select>
          <span className="mono" style={{ fontSize: 11, color: 'var(--text3)' }}>{data?.total ?? 0} results</span>
          <Btn variant="success" onClick={() => setShowAdd(true)}>+ ADD IOC</Btn>
        </div>

        {/* Table */}
        {isLoading ? <Spinner /> : (
          <div style={{ flex: 1, overflowY: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border2)' }}>
                  {['ID','Type','Indicator','Severity','Tags','Score','Actor','First Seen','Hits'].map(h => (
                    <th key={h} style={{ padding: '6px 8px', textAlign: 'left', color: 'var(--text3)', fontWeight: 600, fontSize: 10, textTransform: 'uppercase', letterSpacing: 0.5, whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {items.map((ioc, i) => (
                  <tr key={ioc.id}
                    onClick={() => setSelected(ioc)}
                    style={{
                      borderBottom: '1px solid rgba(255,255,255,0.03)',
                      background: selected?.id === ioc.id ? 'rgba(0,229,255,0.06)' : i%2===0 ? 'transparent' : 'rgba(255,255,255,0.01)',
                      cursor: 'pointer', transition: 'background 0.1s',
                    }}
                    onMouseEnter={e => { if (selected?.id !== ioc.id) (e.currentTarget as HTMLElement).style.background = 'rgba(0,229,255,0.04)' }}
                    onMouseLeave={e => { if (selected?.id !== ioc.id) (e.currentTarget as HTMLElement).style.background = i%2===0 ? 'transparent' : 'rgba(255,255,255,0.01)' }}
                  >
                    <td className="mono" style={{ padding: '7px 8px', color: 'var(--text3)', fontSize: 10 }}>#{ioc.id}</td>
                    <td style={{ padding: '7px 8px' }}>
                      <Tag color={TYPE_COLORS[ioc.ioc_type] ?? 'var(--cyan)'}>{ioc.ioc_type.toUpperCase()}</Tag>
                    </td>
                    <td className="mono" style={{ padding: '7px 8px', color: 'var(--text)', maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: 11 }}>
                      {ioc.value}
                    </td>
                    <td style={{ padding: '7px 8px' }}><SevBadge sev={ioc.severity} /></td>
                    <td style={{ padding: '7px 8px' }}>
                      <div style={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
                        {(ioc.tags ?? []).slice(0,2).map((t: string) => <Tag key={t} color="var(--purple)">{t}</Tag>)}
                      </div>
                    </td>
                    <td className="mono" style={{ padding: '7px 8px', color: ioc.score > 80 ? 'var(--red)' : ioc.score > 60 ? 'var(--orange)' : 'var(--text2)' }}>{ioc.score}</td>
                    <td style={{ padding: '7px 8px', fontSize: 11, color: 'var(--text2)', whiteSpace: 'nowrap' }}>{(ioc.actor_name || '—').split('/')[0].trim()}</td>
                    <td className="mono" style={{ padding: '7px 8px', fontSize: 10, color: 'var(--text3)', whiteSpace: 'nowrap' }}>
                      {ioc.first_seen ? new Date(ioc.first_seen).toLocaleDateString() : '—'}
                    </td>
                    <td className="mono" style={{ padding: '7px 8px', color: 'var(--cyan)' }}>{ioc.hits}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span className="mono" style={{ fontSize: 11, color: 'var(--text3)' }}>Page {page} / {pages}</span>
          <div style={{ display: 'flex', gap: 6 }}>
            <Btn onClick={() => setPage(p => Math.max(1, p-1))} disabled={page <= 1}>PREV</Btn>
            <Btn onClick={() => setPage(p => Math.min(pages, p+1))} disabled={page >= pages}>NEXT</Btn>
          </div>
        </div>
      </div>

      {/* Detail / Add Panel */}
      {(selected || showAdd) && (
        <div className="slide-right" style={{ width: 300, borderLeft: '1px solid var(--border)', background: 'var(--bg1)', overflowY: 'auto', padding: 14, flexShrink: 0 }}>
          {showAdd ? (
            <AddIOCForm onClose={() => setShowAdd(false)} />
          ) : selected && (
            <IOCDetail ioc={selected} onClose={() => setSelected(null)}
              onDelete={() => deleteMut.mutate(selected.id)}
              onBlock={() => { updateMut.mutate({ id: selected.id, data: { is_active: false, notes: 'Blocked by analyst' } }); toast.success('IOC blocked') }}
            />
          )}
        </div>
      )}
    </div>
  )
}

function IOCDetail({ ioc, onClose, onDelete, onBlock }: any) {
  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
        <SectionTitle>IOC DETAIL</SectionTitle>
        <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text3)', cursor: 'pointer', fontSize: 16 }}>✕</button>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {[
          ['ID', `#${ioc.id}`, 'var(--text2)'],
          ['Type', ioc.ioc_type?.toUpperCase(), 'var(--cyan)'],
          ['Severity', ioc.severity?.toUpperCase(), `var(--sev-${ioc.severity}-color, var(--cyan))`],
          ['Score', `${ioc.score}/100`, ioc.score > 80 ? 'var(--red)' : 'var(--orange)'],
          ['Country', ioc.country || '—', 'var(--text2)'],
          ['Hits', ioc.hits, 'var(--cyan)'],
          ['Actor', ioc.actor_name || '—', 'var(--orange)'],
          ['Source', ioc.source || '—', 'var(--text2)'],
          ['First Seen', ioc.first_seen ? new Date(ioc.first_seen).toLocaleDateString() : '—', 'var(--text2)'],
          ['Last Seen', ioc.last_seen ? new Date(ioc.last_seen).toLocaleDateString() : '—', 'var(--text2)'],
        ].map(([k, v, c]) => (
          <div key={k as string} style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border)', paddingBottom: 6 }}>
            <span style={{ fontSize: 11, color: 'var(--text3)' }}>{k as string}</span>
            <span className="mono" style={{ fontSize: 11, color: c as string, textAlign: 'right', maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis' }}>{v as string}</span>
          </div>
        ))}
        <div>
          <div style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 5 }}>Tags</div>
          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
            {(ioc.tags ?? []).map((t: string) => <Tag key={t} color="var(--purple)">{t}</Tag>)}
          </div>
        </div>
        <div>
          <div style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 5 }}>Value</div>
          <div className="mono" style={{ fontSize: 10, wordBreak: 'break-all', padding: '8px', background: 'var(--bg3)', borderRadius: 4 }}>{ioc.value}</div>
        </div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 4 }}>
          <Btn variant="danger" onClick={onBlock}>BLOCK</Btn>
          <Btn variant="danger" onClick={onDelete}>DELETE</Btn>
        </div>
      </div>
    </>
  )
}

function AddIOCForm({ onClose }: { onClose: () => void }) {
  const qc = useQueryClient()
  const [form, setForm] = useState({ ioc_type: 'ip', value: '', severity: 'medium', score: 50, actor_name: '', source: '' })
  const addMut = useMutation({
    mutationFn: () => iocApi.create({ ...form, tags: [], hits: 1 }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['iocs'] }); toast.success('IOC added'); onClose() },
    onError: () => toast.error('Failed to add IOC'),
  })
  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
        <SectionTitle>ADD NEW IOC</SectionTitle>
        <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text3)', cursor: 'pointer', fontSize: 16 }}>✕</button>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {[
          { label: 'Type', key: 'ioc_type', type: 'select', opts: ['ip','domain','hash','url'] },
          { label: 'Value', key: 'value', type: 'text', placeholder: 'IP, domain, hash, or URL' },
          { label: 'Severity', key: 'severity', type: 'select', opts: ['critical','high','medium','low'] },
          { label: 'Score (0-100)', key: 'score', type: 'number' },
          { label: 'Actor', key: 'actor_name', type: 'text', placeholder: 'Threat actor name' },
          { label: 'Source', key: 'source', type: 'text', placeholder: 'e.g. AlienVault OTX' },
        ].map(f => (
          <div key={f.key}>
            <div style={{ fontSize: 10, color: 'var(--text3)', letterSpacing: 1, marginBottom: 4 }}>{f.label.toUpperCase()}</div>
            {f.type === 'select' ? (
              <select value={(form as any)[f.key]} onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))} style={{ width: '100%' }}>
                {f.opts!.map(o => <option key={o} value={o}>{o}</option>)}
              </select>
            ) : (
              <input type={f.type} value={(form as any)[f.key]} placeholder={f.placeholder}
                onChange={e => setForm(p => ({ ...p, [f.key]: f.type === 'number' ? Number(e.target.value) : e.target.value }))}
                style={{ width: '100%' }} />
            )}
          </div>
        ))}
        <Btn variant="success" onClick={() => addMut.mutate()} disabled={!form.value || addMut.isPending}>
          {addMut.isPending ? 'SAVING…' : 'SAVE IOC'}
        </Btn>
      </div>
    </>
  )
}
