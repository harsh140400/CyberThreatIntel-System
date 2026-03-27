"""Alerts API"""
from datetime import datetime, timezone
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from core.database import get_db
from core.security import get_current_user
from models.user import User
from models.alert import Alert

router = APIRouter()


class AlertUpdate(BaseModel):
    status: Optional[str] = None
    assignee: Optional[str] = None


class AlertOut(BaseModel):
    id: int
    title: str
    severity: str
    category: str
    status: str
    assignee: str
    description: str
    timestamp: datetime
    resolved_at: Optional[datetime] = None

    class Config:
        from_attributes = True


@router.get("/")
async def list_alerts(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    severity: Optional[str] = None,
    status: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user),
):
    q = select(Alert)
    if severity:
        q = q.where(Alert.severity == severity)
    if status:
        q = q.where(Alert.status == status)
    total = (await db.execute(select(func.count()).select_from(q.subquery()))).scalar()
    rows = (await db.execute(
        q.order_by(Alert.timestamp.desc()).offset((page - 1) * page_size).limit(page_size)
    )).scalars().all()
    return {"total": total, "items": [AlertOut.model_validate(r) for r in rows]}


@router.patch("/{alert_id}", response_model=AlertOut)
async def update_alert(
    alert_id: int,
    payload: AlertUpdate,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user),
):
    result = await db.execute(select(Alert).where(Alert.id == alert_id))
    alert = result.scalar_one_or_none()
    if not alert:
        raise HTTPException(404, "Alert not found")
    if payload.status:
        alert.status = payload.status
        if payload.status == "resolved":
            alert.resolved_at = datetime.now(timezone.utc)
    if payload.assignee:
        alert.assignee = payload.assignee
    return alert


@router.get("/counts/by-severity")
async def alert_counts(
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user),
):
    rows = (await db.execute(
        select(Alert.severity, Alert.status, func.count())
        .group_by(Alert.severity, Alert.status)
    )).all()
    return [{"severity": r[0], "status": r[1], "count": r[2]} for r in rows]
