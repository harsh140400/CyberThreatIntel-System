"""IOC (Indicator of Compromise) model"""
from datetime import datetime, timezone
from typing import List
from sqlalchemy import String, Integer, Boolean, DateTime, Float, JSON
from sqlalchemy.orm import Mapped, mapped_column
from core.database import Base


class IOC(Base):
    __tablename__ = "iocs"

    id: Mapped[int] = mapped_column(primary_key=True)
    ioc_type: Mapped[str] = mapped_column(String(16), index=True)   # ip|domain|hash|url
    value: Mapped[str] = mapped_column(String(512), index=True)
    severity: Mapped[str] = mapped_column(String(16), index=True)   # critical|high|medium|low
    score: Mapped[int] = mapped_column(Integer, default=50)
    tags: Mapped[List[str]] = mapped_column(JSON, default=list)
    actor_name: Mapped[str] = mapped_column(String(128), default="", index=True)
    country: Mapped[str] = mapped_column(String(4), default="")
    hits: Mapped[int] = mapped_column(Integer, default=1)
    source: Mapped[str] = mapped_column(String(64), default="")
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    first_seen: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
    )
    last_seen: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
    )
    notes: Mapped[str] = mapped_column(String(2048), default="")
