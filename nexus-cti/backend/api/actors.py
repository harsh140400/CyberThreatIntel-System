"""Threat Actors API"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from core.database import get_db
from core.security import get_current_user
from models.user import User
from models.actor import ThreatActor
from models.ioc import IOC

router = APIRouter()


@router.get("/")
async def list_actors(
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user),
):
    rows = (await db.execute(select(ThreatActor).order_by(ThreatActor.risk_score.desc()))).scalars().all()
    return [
        {
            "id": a.id, "name": a.name, "alias": a.alias, "origin": a.origin,
            "actor_type": a.actor_type, "risk_score": a.risk_score,
            "campaigns": a.campaigns, "description": a.description,
            "ttps": a.ttps, "color": a.color,
            "first_observed": a.first_observed, "last_observed": a.last_observed,
        }
        for a in rows
    ]


@router.get("/{actor_id}")
async def get_actor(
    actor_id: int,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user),
):
    result = await db.execute(select(ThreatActor).where(ThreatActor.id == actor_id))
    a = result.scalar_one_or_none()
    if not a:
        raise HTTPException(404, "Threat actor not found")

    # Associated IOCs
    ioc_rows = (await db.execute(
        select(IOC).where(IOC.actor_name == a.name).limit(20)
    )).scalars().all()

    return {
        "id": a.id, "name": a.name, "alias": a.alias, "origin": a.origin,
        "actor_type": a.actor_type, "risk_score": a.risk_score,
        "campaigns": a.campaigns, "description": a.description,
        "ttps": a.ttps, "color": a.color,
        "associated_iocs": [
            {"id": i.id, "type": i.ioc_type, "value": i.value,
             "severity": i.severity, "score": i.score}
            for i in ioc_rows
        ],
    }
