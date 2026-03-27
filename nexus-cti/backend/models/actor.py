"""ThreatActor model"""
from datetime import datetime, timezone
from typing import List
from sqlalchemy import String, Integer, DateTime, JSON
from sqlalchemy.orm import Mapped, mapped_column
from core.database import Base


class ThreatActor(Base):
    __tablename__ = "threat_actors"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(128), unique=True, index=True)
    alias: Mapped[str] = mapped_column(String(128), default="")
    origin: Mapped[str] = mapped_column(String(64))
    actor_type: Mapped[str] = mapped_column(String(64))   # Nation-State|eCrime|RaaS|Hacktivist
    risk_score: Mapped[int] = mapped_column(Integer, default=50)
    campaigns: Mapped[int] = mapped_column(Integer, default=0)
    description: Mapped[str] = mapped_column(String(2048), default="")
    ttps: Mapped[List[str]] = mapped_column(JSON, default=list)
    color: Mapped[str] = mapped_column(String(16), default="#00e5ff")
    first_observed: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    last_observed: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
