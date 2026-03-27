// DarkWebMonitor.tsx — simulated dark web findings dashboard
import { useState } from 'react'
import { SevBadge, Tag, Btn, Card, SectionTitle } from '../shared'

const FINDINGS = [
  { id: 1, forum: 'RAMP', title: 'New victim: Fortune 500 healthcare company (50 GB exfil)', threat: 'Ransomware', date: '2025-08-10', price: '$1.2M ransom', severity: 'critical', actor: 'ALPHV/BlackCat', detail: 'Victim negotiation thread posted. Data includes PII, patient records, financial docs. Double-extortion model. Deadline: 72h.' },
  { id: 2, forum: 'BreachForums', title: 'Banking credential dump — 850 K accounts', threat: 'Credential Theft', date: '2025-08-09', price: '$5,000', severity: 'high', actor: 'Unknown', detail: 'US and EU financial institutions affected. Includes email:password combos, CVVs. Seller reputation: 94%.' },
  { id: 3, forum: 'XSS.is', title: 'RDP access for sale — US pharmaceutical company', threat: 'Initial Access', date: '2025-08-08', price: '$3,500', severity: 'high', actor: 'Initial Access Broker', detail: 'Domain admin credentials. Windows Server 2019. 2,400-employee org. AV: Defender. No EDR.' },
  { id: 4, forum: 'Exploit.in', title: '0-day exploit for enterprise VPN — unpatched', threat: 'Exploit Sale', date: '2025-08-07', price: '$80,000', severity: 'critical', actor: 'Unknown', detail: 'Pre-auth RCE claimed. Popular enterprise SSL-VPN vendor. PoC demo shared in escrow. Verification pending.' },
  { id: 5, forum: 'Telegram', title: 'Hiring skilled pentesters for corporate targets', threat: 'Recruitment', date: '2025-08-07', price: '% Revenue Share', severity: 'medium', actor: 'RaaS Operator', detail: 'Seeking experienced operators. No ransomware background needed. Infra provided. 70/30 split.' },
  { id: 6, forum: 'RAMP', title: 'New affiliate program — BlackCat v3 relaunch', threat: 'RaaS Recruitment', date: '2025-08-06', price: '20% share', severity: 'medium', actor: 'ALPHV/BlackCat', detail: 'New ESXI and Windows locker variants. Rust-based. AV evasion improved. Looking for affiliates with network access.' },
  { id: 7, forum: 'BreachForums', title: 'Government database — 12 M SSNs + full PII', threat: 'Data Breach', date: '2025-08-05', price: '$45,000', severity: 'critical', actor: 'Unknown', detail: 'US state agency. Data includes SSN, DOB, address, employment info. Sample posted for verification.' },
]

export default function DarkWebMonitor() {
  const [selected, setSelected] = useState<typeof FINDINGS[0] | null>(null)
  const [sevFilter, setSevFilter] = useState('all')

  const filtered = sevFilter === 'all' ? FINDINGS : FINDINGS.filter(f => f.severity === sevFilter)

  return (
    <div style={{ display: 'flex', height: '100%', padding: 14, gap: 12 }}>
      {/* List */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 10, minWidth: 0 }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span className="blink" style={{ color: 'var(--red)', fontSize: 10 }}>●</span>
            <span className="orbit" style={{ color: 'var(--red)', fontSize: 13, letterSpacing: 2 }}>DARK WEB MONITOR</span>
            <Tag color="var(--red)">SIMULATED</Tag>
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            {['all','critical','high','medium'].map(s => (
              <Btn key={s} onClick={() => setSevFilter(s)}
                style={sevFilter === s ? { background: 'rgba(255,23,68,0.1)', borderColor: 'var(--red)', color: 'var(--red)' } : {}}>
                {s.toUpperCase()}
              </Btn>
            ))}
          </div>
        </div>

        {/* Findings */}
        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8 }}>
          {filtered.map(f => {
            const sevColors: Record<string, string> = { critical: 'var(--red)', high: 'var(--orange)', medium: 'var(--yellow)', low: 'var(--green)' }
            return (
              <div key={f.id}
                onClick={() => setSelected(selected?.id === f.id ? null : f)}
                className="fade-in"
                style={{
                  padding: '12px 14px', background: 'var(--bg2)', borderRadius: 6,
                  border: `1px solid ${selected?.id === f.id ? sevColors[f.severity] : 'var(--border)'}`,
                  borderLeft: `3px solid ${sevColors[f.severity]}`,
                  cursor: 'pointer', transition: 'border-color 0.15s',
                }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5, flexWrap: 'wrap' }}>
                      <SevBadge sev={f.severity} />
                      <Tag color="var(--purple)">{f.forum}</Tag>
                      <Tag color="var(--cyan)">{f.threat}</Tag>
                    </div>
                    <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 3 }}>{f.title}</div>
                    <div style={{ fontSize: 11, color: 'var(--text3)' }}>{f.actor} · {f.date}</div>
                  </div>
                  <div style={{ textAlign: 'right', marginLeft: 12, flexShrink: 0 }}>
                    <div className="mono" style={{ fontSize: 13, color: 'var(--orange)', fontWeight: 700 }}>{f.price}</div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Detail panel */}
      {selected && (
        <div className="slide-right" style={{ width: 300, flexShrink: 0, borderLeft: '1px solid var(--border)', background: 'var(--bg1)', padding: 14, overflowY: 'auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <SectionTitle>FINDING DETAIL</SectionTitle>
            <button onClick={() => setSelected(null)} style={{ background: 'none', border: 'none', color: 'var(--text3)', cursor: 'pointer', fontSize: 16 }}>✕</button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <SevBadge sev={selected.severity} />
            <div style={{ fontWeight: 700, fontSize: 14, lineHeight: 1.4 }}>{selected.title}</div>
            {[['Forum', selected.forum], ['Threat Type', selected.threat], ['Actor', selected.actor], ['Date', selected.date], ['Listed Price', selected.price]].map(([k, v]) => (
              <div key={k} style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border)', paddingBottom: 6 }}>
                <span style={{ fontSize: 11, color: 'var(--text3)' }}>{k}</span>
                <span className="mono" style={{ fontSize: 11, color: 'var(--text2)' }}>{v}</span>
              </div>
            ))}
            <div>
              <div style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 5 }}>Analysis</div>
              <div style={{ fontSize: 12, color: 'var(--text)', lineHeight: 1.6, padding: '8px 10px', background: 'var(--bg3)', borderRadius: 4 }}>
                {selected.detail}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              <Btn variant="danger" style={{ fontSize: 10 }}>INVESTIGATE</Btn>
              <Btn style={{ fontSize: 10 }}>TRACK ACTOR</Btn>
              <Btn variant="success" style={{ fontSize: 10 }}>ADD INTEL</Btn>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
