"""FeedItem model"""
from datetime import datetime, timezone
from sqlalchemy import String, DateTime
from sqlalchemy.orm import Mapped, mapped_column
from core.database import Base


class FeedItem(Base):
    __tablename__ = "feed_items"

    id: Mapped[int] = mapped_column(primary_key=True)
    message: Mapped[str] = mapped_column(String(512))
    severity: Mapped[str] = mapped_column(String(16), index=True)
    source: Mapped[str] = mapped_column(String(64), default="")
    timestamp: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        index=True,
    )
