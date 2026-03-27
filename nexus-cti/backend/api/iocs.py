"""IOC Management API — CRUD, search, filtering, bulk operations."""
from datetime import datetime, timezone
from typing import Optional, List

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, or_, and_

from core.database import get_db
from core.security import get_current_user
from models.user import User
from models.ioc import IOC

router = APIRouter()


class IOCCreate(BaseModel):
    ioc_type: str
    value: str
    severity: str
    score: int = 50
    tags: List[str] = []
    actor_name: str = ""
    country: str = ""
    source: str = ""
    notes: str = ""


class IOCUpdate(BaseModel):
    severity: Optional[str] = None
    score: Optional[int] = None
    tags: Optional[List[str]] = None
    actor_name: Optional[str] = None
    notes: Optional[str] = None
    is_active: Optional[bool] = None


class IOCOut(BaseModel):
    id: int
    ioc_type: str
    value: str
    severity: str
    score: int
    tags: List[str]
    actor_name: str
    country: str
    hits: int
    source: str
    is_active: bool
    first_seen: datetime
    last_seen: datetime
    notes: str

    class Config:
        from_attributes = True


@router.get("/", response_model=dict)
async def list_iocs(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    ioc_type: Optional[str] = None,
    severity: Optional[str] = None,
    search: Optional[str] = None,
    actor: Optional[str] = None,
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
    if search:
        filters.append(or_(
            IOC.value.ilike(f"%{search}%"),
            IOC.actor_name.ilike(f"%{search}%"),
        ))

    base_q = select(IOC).where(and_(*filters)) if filters else select(IOC)
    total = (await db.execute(select(func.count()).select_from(base_q.subquery()))).scalar()

    rows = (await db.execute(
        base_q.order_by(IOC.score.desc()).offset((page - 1) * page_size).limit(page_size)
    )).scalars().all()

    return {
        "total": total,
        "page": page,
        "page_size": page_size,
        "pages": (total + page_size - 1) // page_size,
        "items": [IOCOut.model_validate(r) for r in rows],
    }


@router.get("/{ioc_id}", response_model=IOCOut)
async def get_ioc(
    ioc_id: int,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user),
):
    result = await db.execute(select(IOC).where(IOC.id == ioc_id))
    ioc = result.scalar_one_or_none()
    if not ioc:
        raise HTTPException(404, "IOC not found")
    return ioc


@router.post("/", response_model=IOCOut, status_code=201)
async def create_ioc(
    payload: IOCCreate,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user),
):
    ioc = IOC(**payload.model_dump())
    db.add(ioc)
    await db.flush()
    return ioc


@router.patch("/{ioc_id}", response_model=IOCOut)
async def update_ioc(
    ioc_id: int,
    payload: IOCUpdate,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user),
):
    result = await db.execute(select(IOC).where(IOC.id == ioc_id))
    ioc = result.scalar_one_or_none()
    if not ioc:
        raise HTTPException(404, "IOC not found")
    for field, val in payload.model_dump(exclude_none=True).items():
        setattr(ioc, field, val)
    ioc.last_seen = datetime.now(timezone.utc)
    return ioc


@router.delete("/{ioc_id}", status_code=204)
async def delete_ioc(
    ioc_id: int,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user),
):
    result = await db.execute(select(IOC).where(IOC.id == ioc_id))
    ioc = result.scalar_one_or_none()
    if not ioc:
        raise HTTPException(404, "IOC not found")
    await db.delete(ioc)


@router.get("/stats/summary")
async def ioc_stats(
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user),
):
    type_rows = (await db.execute(select(IOC.ioc_type, func.count()).group_by(IOC.ioc_type))).all()
    sev_rows = (await db.execute(select(IOC.severity, func.count()).group_by(IOC.severity))).all()
    return {
        "by_type": {r[0]: r[1] for r in type_rows},
        "by_severity": {r[0]: r[1] for r in sev_rows},
        "total": sum(r[1] for r in type_rows),
    }
