// Dashboard.tsx
import { useQuery } from '@tanstack/react-query'
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  RadarChart, Radar, PolarGrid, PolarAngleAxis,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts'
import { dashboardApi } from '../../lib/api'
import { MetricCard, Card, SectionTitle, SevBadge, Spinner } from '../shared'

const MITRE_RADAR = [
  { subject: 'Initial Access', A: 87 },
  { subject: 'Execution', A: 74 },
  { subject: 'Persistence', A: 62 },
  { subject: 'Defense Evasion', A: 91 },
  { subject: 'Credential Access', A: 79 },
  { subject: 'Discovery', A: 83 },
  { subject: 'Lateral Movement', A: 55 },
  { subject: 'Impact', A: 39 },
]

export default function Dashboard() {
  const { data, isLoading } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: () => dashboardApi.stats().then(r => r.data),
    refetchInterval: 60_000,
  })

  if (isLoading || !data) return <Spinner />

  const iocTypeData = Object.entries(data.ioc_types ?? {}).map(([name, value]) => ({ name, value }))
  const sevData = Object.entries(data.ioc_severities ?? {}).map(([name, value]) => ({
    name, value,
    fill: name === 'critical' ? '#ff1744' : name === 'high' ? '#ff9100' : name === 'medium' ? '#ffea00' : '#00e676',
  }))

  return (
    <div style={{ height: '100%', overflowY: 'auto', padding: 14, display: 'flex', flexDirection: 'column', gap: 12 }}>

      {/* Metric Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 10 }}>
        <MetricCard title="Open Alerts"     value={data.alert_open}       sub="Requiring action"       color="var(--red)"    trend={12} />
        <MetricCard title="IOCs Tracked"    value={data.ioc_total}        sub={`${data.ioc_critical} critical`} color="var(--cyan)"   />
        <MetricCard title="Active Campaigns" value={data.active_campaigns} sub="Across all actors"      color="var(--orange)" trend={8}  />
        <MetricCard title="Threat Actors"   value={(data.top_actors ?? []).length} sub="Profiled & monitored" color="var(--purple)" />
        <MetricCard title="Env Risk Score"  value={data.threat_score}     sub="Environment-wide"       color="var(--red)"    trend={5}  />
      </div>

      {/* Charts Row 1 */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: 10 }}>
        {/* 30-day trend */}
        <Card style={{ padding: '10px 6px' }}>
          <SectionTitle>Threat Activity — 30 Days</SectionTitle>
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={data.trend ?? []} margin={{ top: 4, right: 4, bottom: 0, left: -22 }}>
              <defs>
                <linearGradient id="gCrit" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#ff1744" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#ff1744" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gHigh" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#ff9100" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#ff9100" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="date" tick={{ fill: '#4a5f78', fontSize: 9 }} tickLine={false} interval={6} />
              <YAxis tick={{ fill: '#4a5f78', fontSize: 9 }} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={{ background: 'var(--bg3)', border: '1px solid var(--border2)', borderRadius: 4, fontSize: 11 }} />
              <Area type="monotone" dataKey="critical" stroke="#ff1744" fill="url(#gCrit)" strokeWidth={1.5} />
              <Area type="monotone" dataKey="high"     stroke="#ff9100" fill="url(#gHigh)" strokeWidth={1.5} />
            </AreaChart>
          </ResponsiveContainer>
        </Card>

        {/* IOC Types */}
        <Card>
          <SectionTitle>IOC Types</SectionTitle>
          <ResponsiveContainer width="100%" height={150}>
            <PieChart>
              <Pie data={iocTypeData} cx="50%" cy="50%" innerRadius={42} outerRadius={66} paddingAngle={3} dataKey="value">
                {iocTypeData.map((_, i) => (
                  <Cell key={i} fill={['#00e5ff','#e040fb','#ff9100','#00e676'][i % 4]} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ background: 'var(--bg3)', border: '1px solid var(--border2)', fontSize: 11 }} />
            </PieChart>
          </ResponsiveContainer>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, justifyContent: 'center', marginTop: 4 }}>
            {iocTypeData.map((d, i) => (
              <span key={d.name} className="mono" style={{ fontSize: 10, color: ['#00e5ff','#e040fb','#ff9100','#00e676'][i % 4] }}>
                {d.name}: {d.value as number}
              </span>
            ))}
          </div>
        </Card>

        {/* Severity */}
        <Card>
          <SectionTitle>IOC Severity</SectionTitle>
          <ResponsiveContainer width="100%" height={150}>
            <BarChart data={sevData} layout="vertical" margin={{ left: 10, right: 28 }}>
              <XAxis type="number" tick={{ fill: '#4a5f78', fontSize: 9 }} tickLine={false} axisLine={false} />
              <YAxis type="category" dataKey="name" tick={{ fill: 'var(--text2)', fontSize: 11 }} tickLine={false} width={52} />
              <Tooltip contentStyle={{ background: 'var(--bg3)', border: '1px solid var(--border2)', fontSize: 11 }} />
              <Bar dataKey="value" radius={[0, 3, 3, 0]}>
                {sevData.map((d, i) => <Cell key={i} fill={d.fill} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Charts Row 2 */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, flex: 1, minHeight: 0 }}>
        {/* Top Actors */}
        <Card style={{ overflow: 'hidden' }}>
          <SectionTitle>Top Threat Actors</SectionTitle>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {(data.top_actors ?? []).map((a: any) => (
              <div key={a.name} style={{ padding: '8px 10px', background: 'var(--bg3)', borderRadius: 4, border: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ fontWeight: 700, fontSize: 12, color: a.color ?? 'var(--cyan)' }}>{a.name}</span>
                  <span className="mono" style={{ fontSize: 11, color: a.color ?? 'var(--cyan)' }}>{a.risk_score}/100</span>
                </div>
                <div style={{ fontSize: 11, color: 'var(--text2)', marginBottom: 5 }}>{a.origin} · {a.actor_type}</div>
                <div style={{ background: 'var(--bg0)', borderRadius: 2, height: 3 }}>
                  <div style={{ width: `${a.risk_score}%`, height: '100%', background: a.color ?? 'var(--cyan)', borderRadius: 2, opacity: 0.8 }} />
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* MITRE Radar */}
        <Card>
          <SectionTitle>MITRE ATT&CK Coverage</SectionTitle>
          <ResponsiveContainer width="100%" height={230}>
            <RadarChart data={MITRE_RADAR}>
              <PolarGrid stroke="rgba(0,229,255,0.1)" />
              <PolarAngleAxis dataKey="subject" tick={{ fill: 'var(--text2)', fontSize: 9 }} />
              <Radar dataKey="A" stroke="#00e5ff" fill="#00e5ff" fillOpacity={0.13} strokeWidth={1.5} />
              <Tooltip contentStyle={{ background: 'var(--bg3)', border: '1px solid var(--border2)', fontSize: 11 }} />
            </RadarChart>
          </ResponsiveContainer>
        </Card>

        {/* Geo */}
        <Card style={{ overflow: 'hidden' }}>
          <SectionTitle>Attack Origins</SectionTitle>
          {(data.geo ?? []).map((g: any) => (
            <div key={g.country} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <span className="mono" style={{ fontSize: 11, color: 'var(--text3)', width: 22 }}>{g.country}</span>
              <div style={{ flex: 1, background: 'var(--bg0)', borderRadius: 2, height: 6 }}>
                <div style={{
                  width: `${Math.min(100, Math.round((g.count / 150) * 100))}%`,
                  height: '100%', borderRadius: 2, opacity: 0.85,
                  background: g.count > 40 ? 'var(--red)' : g.count > 20 ? 'var(--orange)' : 'var(--cyan)',
                }} />
              </div>
              <span className="mono" style={{ fontSize: 11, color: 'var(--text2)', width: 28, textAlign: 'right' }}>{g.count}</span>
            </div>
          ))}
        </Card>
      </div>
    </div>
  )
}
