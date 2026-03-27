"""Alert model"""
from datetime import datetime, timezone
from sqlalchemy import String, DateTime
from sqlalchemy.orm import Mapped, mapped_column
from core.database import Base


class Alert(Base):
    __tablename__ = "alerts"

    id: Mapped[int] = mapped_column(primary_key=True)
    title: Mapped[str] = mapped_column(String(256))
    severity: Mapped[str] = mapped_column(String(16), index=True)
    category: Mapped[str] = mapped_column(String(64))
    status: Mapped[str] = mapped_column(String(32), default="open", index=True)
    assignee: Mapped[str] = mapped_column(String(64), default="unassigned")
    description: Mapped[str] = mapped_column(String(2048), default="")
    timestamp: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        index=True,
    )
    resolved_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
