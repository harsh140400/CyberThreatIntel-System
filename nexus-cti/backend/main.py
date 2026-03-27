"""
NEXUS CTI Platform — FastAPI Backend
=====================================
Production-grade Cyber Threat Intelligence platform API.
"""
import asyncio
import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware

from core.config import settings
from core.database import init_db
from core.seeder import seed_database
from api import (
    auth, iocs, alerts, actors, malware,
    feed, reports, ai_analysis, hunting, dashboard
)

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)-8s | %(name)s | %(message)s",
)
logger = logging.getLogger("nexus-cti")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup / shutdown lifecycle."""
    logger.info("🚀 NEXUS CTI Platform starting up...")
    await init_db()
    await seed_database()
    logger.info("✅ Database ready")
    yield
    logger.info("🛑 NEXUS CTI Platform shutting down...")


app = FastAPI(
    title="NEXUS CTI Platform",
    description="Enterprise-grade Cyber Threat Intelligence Platform API",
    version="1.0.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    lifespan=lifespan,
)

# ─── Middleware ────────────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── Routers ──────────────────────────────────────────────────────────────────
app.include_router(auth.router,        prefix="/api/auth",      tags=["Authentication"])
app.include_router(dashboard.router,   prefix="/api/dashboard", tags=["Dashboard"])
app.include_router(iocs.router,        prefix="/api/iocs",      tags=["IOC Management"])
app.include_router(alerts.router,      prefix="/api/alerts",    tags=["Alerts"])
app.include_router(actors.router,      prefix="/api/actors",    tags=["Threat Actors"])
app.include_router(malware.router,     prefix="/api/malware",   tags=["Malware Intel"])
app.include_router(feed.router,        prefix="/api/feed",      tags=["Threat Feed"])
app.include_router(hunting.router,     prefix="/api/hunt",      tags=["Threat Hunting"])
app.include_router(reports.router,     prefix="/api/reports",   tags=["Reports"])
app.include_router(ai_analysis.router, prefix="/api/ai",        tags=["AI Analysis"])


@app.get("/api/health")
async def health_check():
    return {"status": "operational", "version": "1.0.0", "platform": "NEXUS CTI"}
