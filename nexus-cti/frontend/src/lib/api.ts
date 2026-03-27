// lib/api.ts — Axios instance + typed API helpers
import axios from 'axios'

export const api = axios.create({ baseURL: '/api' })

// Attach JWT on every request
api.interceptors.request.use((cfg) => {
  const token = localStorage.getItem('nexus_token')
  if (token) cfg.headers.Authorization = `Bearer ${token}`
  return cfg
})

// Redirect to login on 401
api.interceptors.response.use(
  (r) => r,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('nexus_token')
      window.location.href = '/login'
    }
    return Promise.reject(err)
  },
)

// ── Auth ─────────────────────────────────────────────────────────────────────
export const authApi = {
  login: (username: string, password: string) => {
    const body = new URLSearchParams({ username, password })
    return api.post('/auth/token', body, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    })
  },
  me: () => api.get('/auth/me'),
}

// ── Dashboard ────────────────────────────────────────────────────────────────
export const dashboardApi = {
  stats: () => api.get('/dashboard/stats'),
}

// ── IOCs ─────────────────────────────────────────────────────────────────────
export const iocApi = {
  list:   (params?: object) => api.get('/iocs/', { params }),
  get:    (id: number)      => api.get(`/iocs/${id}`),
  create: (data: object)    => api.post('/iocs/', data),
  update: (id: number, data: object) => api.patch(`/iocs/${id}`, data),
  delete: (id: number)      => api.delete(`/iocs/${id}`),
  stats:  ()                => api.get('/iocs/stats/summary'),
}

// ── Alerts ───────────────────────────────────────────────────────────────────
export const alertApi = {
  list:   (params?: object) => api.get('/alerts/', { params }),
  update: (id: number, data: object) => api.patch(`/alerts/${id}`, data),
  counts: ()                => api.get('/alerts/counts/by-severity'),
}

// ── Threat Actors ─────────────────────────────────────────────────────────────
export const actorApi = {
  list: ()             => api.get('/actors/'),
  get:  (id: number)   => api.get(`/actors/${id}`),
}

// ── Malware ───────────────────────────────────────────────────────────────────
export const malwareApi = {
  list: ()             => api.get('/malware/'),
  get:  (id: number)   => api.get(`/malware/${id}`),
}

// ── Feed ─────────────────────────────────────────────────────────────────────
export const feedApi = {
  list: (params?: object) => api.get('/feed/', { params }),
}

// ── Hunting ───────────────────────────────────────────────────────────────────
export const huntApi = {
  search:   (params: object) => api.get('/hunt/search', { params }),
  pivot:    (id: number)     => api.get(`/hunt/pivot/${id}`),
  timeline: (days = 14)      => api.get('/hunt/timeline', { params: { days } }),
}

// ── Reports ───────────────────────────────────────────────────────────────────
export const reportApi = {
  generate: (data: object) => api.post('/reports/generate', data),
  list:     ()             => api.get('/reports/'),
  get:      (id: number)   => api.get(`/reports/${id}`),
}

// ── AI Analysis ───────────────────────────────────────────────────────────────
export const aiApi = {
  analyze: (messages: { role: string; content: string }[]) =>
    api.post('/ai/analyze', { messages }),
}
