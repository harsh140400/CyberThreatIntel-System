"""Threat Hunting API — advanced search, pivot, timeline."""
from typing import Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, or_, and_, func

from core.database import get_db
from core.security import get_current_user
from models.user import User
from models.ioc import IOC

router = APIRouter()


@router.get("/search")
async def hunt_search(
    q: Optional[str] = Query(None, description="Free-text or structured query"),
    ioc_type: Optional[str] = None,
    severity: Optional[str] = None,
    actor: Optional[str] = None,
    tag: Optional[str] = None,
    min_score: Optional[int] = None,
    max_score: Optional[int] = None,
    limit: int = Query(50, ge=1, le=200),
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user),
):
    filters = []
    if ioc_type:
        filters.append(IOC.ioc_type == ioc_type)
    if severity:
        filters.append(IOC.severity == severity)
    if actor:
        filters.append(IOC.actor_name.ilike(f"%{actor}%"))
    if min_score is not None:
        filters.append(IOC.score >= min_score)
    if max_score is not None:
        filters.append(IOC.score <= max_score)

    # Free-text search across value and actor
    if q:
        # Parse simple DSL: "type:ip severity:critical"
        parts = q.split()
        for part in parts:
            if ":" in part:
                k, v = part.split(":", 1)
                if k == "type":
                    filters.append(IOC.ioc_type == v)
                elif k == "severity":
                    filters.append(IOC.severity == v)
                elif k == "actor":
                    filters.append(IOC.actor_name.ilike(f"%{v}%"))
                elif k == "score":
                    filters.append(IOC.score >= int(v))
            else:
                filters.append(or_(
                    IOC.value.ilike(f"%{part}%"),
                    IOC.actor_name.ilike(f"%{part}%"),
                ))

    stmt = select(IOC)
    if filters:
        stmt = stmt.where(and_(*filters))
    stmt = stmt.order_by(IOC.score.desc()).limit(limit)
    rows = (await db.execute(stmt)).scalars().all()

    return {
        "count": len(rows),
        "results": [
            {
                "id": r.id, "type": r.ioc_type, "value": r.value,
                "severity": r.severity, "score": r.score, "tags": r.tags,
                "actor": r.actor_name, "country": r.country, "hits": r.hits,
                "first_seen": r.first_seen, "last_seen": r.last_seen, "source": r.source,
            }
            for r in rows
        ],
    }


@router.get("/pivot/{ioc_id}")
async def pivot(
    ioc_id: int,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user),
):
    """Return the selected IOC plus all related IOCs sharing actor/tags."""
    result = await db.execute(select(IOC).where(IOC.id == ioc_id))
    ioc = result.scalar_one_or_none()
    if not ioc:
        return {"error": "IOC not found"}

    # Related by actor
    related_actor = (await db.execute(
        select(IOC).where(
            IOC.actor_name == ioc.actor_name,
            IOC.id != ioc_id,
        ).limit(10)
    )).scalars().all()

    return {
        "ioc": {
            "id": ioc.id, "type": ioc.ioc_type, "value": ioc.value,
            "severity": ioc.severity, "score": ioc.score, "tags": ioc.tags,
            "actor": ioc.actor_name, "country": ioc.country,
            "hits": ioc.hits, "source": ioc.source,
            "first_seen": ioc.first_seen, "last_seen": ioc.last_seen,
        },
        "related": [
            {"id": r.id, "type": r.ioc_type, "value": r.value,
             "severity": r.severity, "score": r.score}
            for r in related_actor
        ],
    }


@router.get("/timeline")
async def timeline(
    days: int = Query(14, ge=1, le=90),
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user),
):
    from datetime import timedelta, timezone
    from datetime import datetime
    from collections import defaultdict

    since = datetime.now(timezone.utc) - timedelta(days=days)
    rows = (await db.execute(
        select(IOC.first_seen, IOC.severity).where(IOC.first_seen >= since)
    )).all()

    bucket: dict = defaultdict(lambda: {"critical": 0, "high": 0, "medium": 0, "low": 0})
    for row in rows:
        day = row[0].strftime("%b %d")
        bucket[day][row[1]] = bucket[day].get(row[1], 0) + 1

    now = datetime.now(timezone.utc)
    result = []
    for i in range(days - 1, -1, -1):
        d = (now - timedelta(days=i)).strftime("%b %d")
        entry = {"date": d}
        entry.update(bucket.get(d, {"critical": 0, "high": 0, "medium": 0, "low": 0}))
        result.append(entry)
    return result
