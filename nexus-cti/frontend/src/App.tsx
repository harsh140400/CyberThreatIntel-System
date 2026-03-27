// App.tsx — root layout, auth guard, panel routing
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom'
import { useAuthStore, useUIStore } from './lib/store'
import Login from './components/Login'
import Layout from './components/Layout'
import Dashboard from './components/dashboard/Dashboard'
import ThreatFeed from './components/ThreatFeed'
import IOCManager from './components/ioc/IOCManager'
import ThreatHunting from './components/hunting/ThreatHunting'
import ThreatActors from './components/actors/ThreatActors'
import MalwareIntel from './components/malware/MalwareIntel'
import MitreATTCK from './components/mitre/MitreATTCK'
import DarkWebMonitor from './components/darkweb/DarkWebMonitor'
import Alerts from './components/alerts/Alerts'
import Reports from './components/reports/Reports'
import AIAnalysis from './components/ai/AIAnalysis'

function RequireAuth({ children }: { children: React.ReactNode }) {
  const token = useAuthStore((s) => s.token)
  return token ? <>{children}</> : <Navigate to="/login" replace />
}

export default function App() {
  return (
    <>
      <div className="scanline" />
      <div className="grid-bg" style={{ position: 'fixed', inset: 0, pointerEvents: 'none', opacity: 0.6 }} />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          path="/*"
          element={
            <RequireAuth>
              <Layout>
                <Routes>
                  <Route path="/"         element={<Navigate to="/dashboard" replace />} />
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/feed"      element={<ThreatFeed />} />
                  <Route path="/ioc"       element={<IOCManager />} />
                  <Route path="/hunt"      element={<ThreatHunting />} />
                  <Route path="/actors"    element={<ThreatActors />} />
                  <Route path="/malware"   element={<MalwareIntel />} />
                  <Route path="/mitre"     element={<MitreATTCK />} />
                  <Route path="/darkweb"   element={<DarkWebMonitor />} />
                  <Route path="/alerts"    element={<Alerts />} />
                  <Route path="/reports"   element={<Reports />} />
                  <Route path="/ai"        element={<AIAnalysis />} />
                  <Route path="*"          element={<Navigate to="/dashboard" replace />} />
                </Routes>
              </Layout>
            </RequireAuth>
          }
        />
      </Routes>
    </>
  )
}
