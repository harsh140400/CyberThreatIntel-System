"""Threat Feed API — live feed with WebSocket support."""
import asyncio
import random
from datetime import datetime, timezone, timedelta

from fastapi import APIRouter, Depends, WebSocket, WebSocketDisconnect, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from core.database import get_db, AsyncSessionLocal
from core.security import get_current_user
from models.user import User
from models.feed_item import FeedItem

router = APIRouter()

LIVE_MESSAGES = [
    ("New ransomware sample submitted to sandbox — analysis pending", "high"),
    ("Threat actor infrastructure rotated — 8 new IPs blacklisted", "high"),
    ("Malicious document exploiting CVE-2024-12345 detected", "critical"),
    ("BEC campaign targeting CFOs — 23 domains registered today", "high"),
    ("LockBit RaaS portal updated with new victim", "critical"),
    ("Mass credential stuffing attack — 120K attempts/hour", "critical"),
    ("C2 beacon detected via JA3 fingerprint matching", "critical"),
    ("Phishing kit targeting Microsoft 365 credentials active", "high"),
    ("Suspicious DNS tunneling activity detected", "medium"),
    ("New Cobalt Strike teamserver identified — 3 IPs blocked", "high"),
    ("Tor exit node traffic spike detected in network", "medium"),
    ("New zero-day for Ivanti VPN under active exploitation", "critical"),
    ("Supply chain compromise in popular npm package detected", "critical"),
    ("APT lateral movement detected via SMB protocol anomaly", "high"),
    ("Dark web credential dump — 500K accounts listed", "high"),
]
SOURCES = ["AlienVault OTX", "MISP", "FS-ISAC", "CISA", "Internal Sensor", "DarkWeb Monitor", "OSINT"]


@router.get("/")
async def get_feed(
    page: int = Query(1, ge=1),
    page_size: int = Query(30, ge=1, le=100),
    severity: str | None = None,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user),
):
    q = select(FeedItem)
    if severity:
        q = q.where(FeedItem.severity == severity)
    total = (await db.execute(select(func.count()).select_from(q.subquery()))).scalar()
    rows = (await db.execute(
        q.order_by(FeedItem.timestamp.desc()).offset((page - 1) * page_size).limit(page_size)
    )).scalars().all()
    return {
        "total": total,
        "items": [
            {"id": r.id, "message": r.message, "severity": r.severity,
             "source": r.source, "timestamp": r.timestamp}
            for r in rows
        ],
    }


@router.websocket("/ws")
async def feed_websocket(websocket: WebSocket):
    """Push live threat feed updates every 5–10 seconds."""
    await websocket.accept()
    try:
        while True:
            await asyncio.sleep(random.uniform(4, 9))
            msg, sev = random.choice(LIVE_MESSAGES)
            payload = {
                "id": random.randint(10000, 99999),
                "message": msg,
                "severity": sev,
                "source": random.choice(SOURCES),
                "timestamp": datetime.now(timezone.utc).isoformat(),
            }
            await websocket.send_json(payload)
    except WebSocketDisconnect:
        pass
