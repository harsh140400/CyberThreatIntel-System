"""Dashboard aggregation endpoint."""
from datetime import datetime, timedelta, timezone
from collections import defaultdict

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from core.database import get_db
from core.security import get_current_user
from models.user import User
from models.ioc import IOC
from models.alert import Alert
from models.actor import ThreatActor
from models.feed_item import FeedItem

router = APIRouter()


@router.get("/stats")
async def get_stats(
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user),
):
    now = datetime.now(timezone.utc)
    since_7d = now - timedelta(days=7)
    since_30d = now - timedelta(days=30)

    # IOC counts
    ioc_total = (await db.execute(select(func.count()).select_from(IOC))).scalar()
    ioc_critical = (await db.execute(select(func.count()).select_from(IOC).where(IOC.severity == "critical"))).scalar()

    # Alert counts
    alert_open = (await db.execute(select(func.count()).select_from(Alert).where(Alert.status == "open"))).scalar()
    alert_critical = (await db.execute(select(func.count()).select_from(Alert).where(
        Alert.severity == "critical", Alert.status != "resolved"
    ))).scalar()
    alert_high = (await db.execute(select(func.count()).select_from(Alert).where(
        Alert.severity == "high", Alert.status != "resolved"
    ))).scalar()

    # IOC type distribution
    type_rows = (await db.execute(
        select(IOC.ioc_type, func.count()).group_by(IOC.ioc_type)
    )).all()
    ioc_types = {r[0]: r[1] for r in type_rows}

    # Severity distribution
    sev_rows = (await db.execute(
        select(IOC.severity, func.count()).group_by(IOC.severity)
    )).all()
    ioc_severities = {r[0]: r[1] for r in sev_rows}

    # Geo distribution
    geo_rows = (await db.execute(
        select(IOC.country, func.count()).group_by(IOC.country).order_by(func.count().desc()).limit(10)
    )).all()
    geo = [{"country": r[0], "count": r[1]} for r in geo_rows if r[0]]

    # Trend — last 30 days
    trend_rows = (await db.execute(
        select(IOC.first_seen, IOC.severity).where(IOC.first_seen >= since_30d)
    )).all()
    trend_map = defaultdict(lambda: {"critical": 0, "high": 0, "medium": 0, "low": 0})
    for row in trend_rows:
        day = row[0].strftime("%b %d")
        trend_map[day][row[1]] += 1

    # Build last-30-days list in order
    trend = []
    for i in range(29, -1, -1):
        d = (now - timedelta(days=i)).strftime("%b %d")
        entry = {"date": d}
        entry.update(trend_map.get(d, {"critical": 0, "high": 0, "medium": 0, "low": 0}))
        trend.append(entry)

    # Top actors
    actor_rows = (await db.execute(
        select(ThreatActor).order_by(ThreatActor.risk_score.desc()).limit(5)
    )).scalars().all()
    top_actors = [
        {"name": a.name, "risk_score": a.risk_score, "origin": a.origin,
         "actor_type": a.actor_type, "campaigns": a.campaigns, "color": a.color}
        for a in actor_rows
    ]

    return {
        "ioc_total": ioc_total,
        "ioc_critical": ioc_critical,
        "alert_open": alert_open,
        "alert_critical": alert_critical,
        "alert_high": alert_high,
        "threat_score": 7.8,
        "active_campaigns": 12,
        "ioc_types": ioc_types,
        "ioc_severities": ioc_severities,
        "geo": geo,
        "trend": trend,
        "top_actors": top_actors,
    }
