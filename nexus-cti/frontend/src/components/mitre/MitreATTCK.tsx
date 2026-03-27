// MitreATTCK.tsx — full tactic/technique coverage heatmap
import { useState } from 'react'
import { Card, SectionTitle, Tag } from '../shared'

const TACTICS = [
  { id: 'TA0001', name: 'Initial Access',     score: 87, techniques: ['T1190 – Exploit Public-Facing App','T1566 – Phishing','T1078 – Valid Accounts','T1133 – External Remote Services','T1199 – Trusted Relationship'] },
  { id: 'TA0002', name: 'Execution',           score: 74, techniques: ['T1059 – Command & Scripting Interpreter','T1204 – User Execution','T1106 – Native API','T1053 – Scheduled Task/Job','T1569 – System Services'] },
  { id: 'TA0003', name: 'Persistence',         score: 62, techniques: ['T1078 – Valid Accounts','T1543 – Create/Modify System Process','T1547 – Boot/Logon Autostart','T1505 – Server Software Component','T1176 – Browser Extensions'] },
  { id: 'TA0004', name: 'Priv. Escalation',    score: 58, techniques: ['T1548 – Abuse Elevation Control','T1134 – Access Token Manipulation','T1055 – Process Injection','T1068 – Exploitation for Privilege','T1078 – Valid Accounts'] },
  { id: 'TA0005', name: 'Defense Evasion',     score: 91, techniques: ['T1036 – Masquerading','T1027 – Obfuscated Files','T1562 – Impair Defenses','T1070 – Indicator Removal','T1055 – Process Injection'] },
  { id: 'TA0006', name: 'Credential Access',   score: 79, techniques: ['T1003 – OS Credential Dumping','T1552 – Unsecured Credentials','T1110 – Brute Force','T1558 – Steal/Forge Kerberos Tickets','T1056 – Input Capture'] },
  { id: 'TA0007', name: 'Discovery',           score: 83, techniques: ['T1082 – System Information Discovery','T1083 – File & Directory Discovery','T1087 – Account Discovery','T1069 – Permission Groups Discovery','T1046 – Network Service Scan'] },
  { id: 'TA0008', name: 'Lateral Movement',    score: 55, techniques: ['T1021 – Remote Services','T1534 – Internal Spearphishing','T1550 – Use Alternate Auth Material','T1563 – Remote Service Session Hijack','T1570 – Lateral Tool Transfer'] },
  { id: 'TA0009', name: 'Collection',          score: 47, techniques: ['T1005 – Data from Local System','T1039 – Data from Network Share','T1025 – Data from Removable Media','T1074 – Data Staged','T1113 – Screen Capture'] },
  { id: 'TA0010', name: 'Exfiltration',        score: 43, techniques: ['T1041 – Exfil Over C2 Channel','T1048 – Exfil Over Alt Protocol','T1567 – Exfil Over Web Service','T1030 – Data Transfer Size Limits','T1020 – Automated Exfiltration'] },
  { id: 'TA0011', name: 'Command & Control',   score: 68, techniques: ['T1071 – Application Layer Protocol','T1095 – Non-Application Layer Protocol','T1571 – Non-Standard Port','T1573 – Encrypted Channel','T1572 – Protocol Tunneling'] },
  { id: 'TA0040', name: 'Impact',              score: 39, techniques: ['T1486 – Data Encrypted for Impact','T1490 – Inhibit System Recovery','T1489 – Service Stop','T1485 – Data Destruction','T1491 – Defacement'] },
]

function scoreColor(s: number) {
  if (s >= 80) return 'var(--red)'
  if (s >= 60) return 'var(--orange)'
  if (s >= 40) return 'var(--yellow)'
  return 'var(--text3)'
}

function scoreBg(s: number) {
  if (s >= 80) return 'rgba(255,23,68,0.18)'
  if (s >= 60) return 'rgba(255,145,0,0.18)'
  if (s >= 40) return 'rgba(255,234,0,0.12)'
  return 'rgba(255,255,255,0.04)'
}

export default function MitreATTCK() {
  const [selected, setSelected] = useState<typeof TACTICS[0] | null>(null)

  return (
    <div style={{ height: '100%', overflowY: 'auto', padding: 14 }}>
      <div style={{ marginBottom: 14 }}>
        <div className="orbit" style={{ fontSize: 13, color: 'var(--cyan)', letterSpacing: 2, marginBottom: 4 }}>MITRE ATT&CK FRAMEWORK</div>
        <div style={{ fontSize: 12, color: 'var(--text3)' }}>Threat coverage mapped to enterprise tactics and techniques. Click a tile to expand techniques.</div>
      </div>

      {/* Tactic grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10, marginBottom: 16 }}>
        {TACTICS.map(t => (
          <div key={t.id}
            onClick={() => setSelected(selected?.id === t.id ? null : t)}
            style={{
              padding: '10px 12px', borderRadius: 6, cursor: 'pointer',
              background: selected?.id === t.id ? scoreBg(t.score) : 'var(--bg2)',
              border: `1px solid ${selected?.id === t.id ? scoreColor(t.score) : 'var(--border)'}`,
              transition: 'all 0.15s',
            }}>
            <div className="mono" style={{ fontSize: 9, color: 'var(--text3)', marginBottom: 3 }}>{t.id}</div>
            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)', marginBottom: 8 }}>{t.name}</div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ flex: 1, background: 'var(--bg0)', borderRadius: 2, height: 4 }}>
                <div style={{ width: `${t.score}%`, height: '100%', background: scoreColor(t.score), borderRadius: 2, transition: 'width 0.4s' }} />
              </div>
              <span className="mono" style={{ fontSize: 11, color: scoreColor(t.score), marginLeft: 8, minWidth: 32, textAlign: 'right' }}>
                {t.score}%
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Legend */}
      <div style={{ display: 'flex', gap: 16, marginBottom: 16, fontSize: 11 }}>
        {[['≥80% High coverage', 'var(--red)'], ['60–79% Medium', 'var(--orange)'], ['40–59% Low', 'var(--yellow)'], ['<40% Minimal', 'var(--text3)']].map(([l, c]) => (
          <span key={l} style={{ display: 'flex', alignItems: 'center', gap: 5, color: 'var(--text2)' }}>
            <span style={{ width: 10, height: 10, borderRadius: 2, background: c as string, display: 'inline-block' }} />
            {l}
          </span>
        ))}
      </div>

      {/* Technique detail */}
      {selected && (
        <Card className="fade-in">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <div>
              <span className="mono" style={{ fontSize: 10, color: 'var(--text3)', marginRight: 8 }}>{selected.id}</span>
              <span style={{ fontSize: 14, fontWeight: 700, color: scoreColor(selected.score) }}>{selected.name}</span>
            </div>
            <span className="mono" style={{ fontSize: 14, color: scoreColor(selected.score) }}>{selected.score}% observed</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 8 }}>
            {selected.techniques.map(t => {
              const [id, ...rest] = t.split(' – ')
              return (
                <div key={t} style={{ padding: '8px 12px', background: 'var(--bg3)', borderRadius: 4, border: '1px solid var(--border)' }}>
                  <div className="mono" style={{ fontSize: 11, color: 'var(--cyan)', marginBottom: 2 }}>{id}</div>
                  <div style={{ fontSize: 12, color: 'var(--text2)' }}>{rest.join(' – ')}</div>
                  <div style={{ fontSize: 10, color: 'var(--text3)', marginTop: 4 }}>
                    Observed in {Math.floor(Math.random() * 5 + 1)} active campaigns
                  </div>
                </div>
              )
            })}
          </div>
        </Card>
      )}
    </div>
  )
}
