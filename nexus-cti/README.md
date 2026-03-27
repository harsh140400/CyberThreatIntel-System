# NEXUS CTI Platform

Enterprise-grade **Cyber Threat Intelligence Platform** for SOC teams, blue teams, and threat hunters.

```
┌─────────────────────────────────────────────────────────────┐
│  ██ NEXUS CTI — Cyber Threat Intelligence Platform          │
│  FastAPI + SQLite backend · React + TypeScript frontend     │
│  AI-powered analysis via Anthropic Claude                   │
└─────────────────────────────────────────────────────────────┘
```

## Features

| Module | Description |
|---|---|
| **SOC Dashboard** | Real-time metrics, 30-day trends, MITRE radar, geo heatmap |
| **Live Threat Feed** | WebSocket real-time feed with severity filtering |
| **IOC Manager** | Full CRUD for IPs, domains, hashes, URLs with tagging |
| **Threat Hunting** | DSL query engine, pivot investigation, activity timeline |
| **Threat Actors** | Profiles with TTPs, risk scores, associated IOCs |
| **Malware Intel** | Family profiles with sandbox analysis charts |
| **MITRE ATT&CK** | Full tactic/technique coverage heatmap |
| **Dark Web Monitor** | Simulated dark web findings dashboard |
| **Alert Management** | Triage workflow: Open → Investigating → Resolved |
| **Reports** | Structured CTI report generator with JSON export |
| **AI Analysis** | Claude-powered threat analyst chat with platform context |

---

## Quick Start

### Prerequisites

- Python 3.11+
- Node.js 18+

---

### 1. Backend

```bash
cd backend

# Create virtual environment
python -m venv .venv
source .venv/bin/activate        # Windows: .venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Edit .env — set ANTHROPIC_API_KEY for AI Analysis (optional)

# Start the API server
uvicorn main:app --reload --port 8000
```

The backend auto-creates the SQLite database (`nexus_cti.db`) and seeds it with realistic threat intelligence data on first run.

**API docs:** http://localhost:8000/api/docs

---

### 2. Frontend

```bash
cd frontend

# Install dependencies
npm install

# Start the dev server
npm run dev
```

**App:** http://localhost:5173

---

### Default Credentials

| Username | Password | Role |
|---|---|---|
| `admin` | `admin123` | Admin |
| `alice.chen` | `analyst123` | Analyst |
| `bob.malik` | `analyst123` | Analyst |

---

## Architecture

```
nexus-cti/
├── backend/
│   ├── main.py                  # FastAPI application entry point
│   ├── requirements.txt
│   ├── .env.example
│   ├── core/
│   │   ├── config.py            # Pydantic settings
│   │   ├── database.py          # Async SQLite via SQLAlchemy 2.0
│   │   ├── security.py          # JWT auth + password hashing
│   │   └── seeder.py            # Realistic seed data generator
│   ├── models/
│   │   ├── user.py
│   │   ├── ioc.py               # Indicators of Compromise
│   │   ├── alert.py
│   │   ├── actor.py             # Threat Actors
│   │   ├── malware_model.py     # Malware Families
│   │   ├── feed_item.py         # Threat Feed
│   │   └── report.py
│   └── api/
│       ├── auth.py              # Login, register, JWT token
│       ├── dashboard.py         # Aggregated SOC stats
│       ├── iocs.py              # IOC CRUD + search
│       ├── alerts.py            # Alert triage
│       ├── actors.py            # Threat actor profiles
│       ├── malware.py           # Malware intelligence
│       ├── feed.py              # Feed + WebSocket
│       ├── hunting.py           # DSL search, pivot, timeline
│       ├── reports.py           # Report generation + storage
│       └── ai_analysis.py       # Anthropic Claude integration
│
└── frontend/
    ├── index.html
    ├── vite.config.ts
    ├── package.json
    └── src/
        ├── main.tsx             # React entry point
        ├── App.tsx              # Router + auth guard
        ├── lib/
        │   ├── api.ts           # Axios + all API helpers
        │   └── store.ts         # Zustand auth + UI state
        ├── styles/
        │   └── global.css       # Cyberpunk dark theme
        └── components/
            ├── shared/          # SevBadge, Card, Btn, Tag, etc.
            ├── Login.tsx
            ├── Layout.tsx       # TopBar + Sidebar
            ├── ThreatFeed.tsx
            ├── dashboard/       Dashboard.tsx
            ├── ioc/             IOCManager.tsx
            ├── hunting/         ThreatHunting.tsx
            ├── actors/          ThreatActors.tsx
            ├── malware/         MalwareIntel.tsx
            ├── mitre/           MitreATTCK.tsx
            ├── darkweb/         DarkWebMonitor.tsx
            ├── alerts/          Alerts.tsx
            ├── reports/         Reports.tsx
            └── ai/              AIAnalysis.tsx
```

---

## Configuration

All backend configuration is in `backend/.env`:

```env
SECRET_KEY=your-random-secret-key
DATABASE_URL=sqlite+aiosqlite:///./nexus_cti.db
ANTHROPIC_API_KEY=sk-ant-...        # Required for AI Analysis panel
CORS_ORIGINS=["http://localhost:5173"]
ACCESS_TOKEN_EXPIRE_MINUTES=480
```

---

## Production Build

```bash
# Build frontend
cd frontend && npm run build

# Serve with uvicorn + static files
cd backend
uvicorn main:app --host 0.0.0.0 --port 8000 --workers 4
```

---

## Tech Stack

**Backend:** Python 3.11, FastAPI, SQLAlchemy 2.0 async, aiosqlite, python-jose (JWT), passlib (bcrypt), Anthropic SDK

**Frontend:** React 18, TypeScript, Vite, React Router 6, TanStack Query, Recharts, Zustand, Axios, react-hot-toast

**Database:** SQLite (via aiosqlite — zero-config, file-based)

---

## Legal Notice

This platform is designed exclusively for **authorized security professionals**, SOC teams, and cybersecurity research in controlled environments. All threat data included is simulated and synthetic. Users are responsible for ensuring lawful, authorized use.
