from datetime import UTC, datetime

from sqlalchemy import Column, DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import relationship

from app.core.database import Base


def utcnow() -> datetime:
    return datetime.now(UTC).replace(tzinfo=None)


class InsightHistory(Base):
    __tablename__ = "insight_history"

    insight_id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.user_id"), nullable=False, index=True)
    import_batch_id = Column(
        Integer,
        ForeignKey("import_batches.import_batch_id"),
        nullable=True,
        index=True,
    )
    headline = Column(String(255), nullable=False)
    priority_level = Column(String(50), nullable=False)
    summary_text = Column(Text, nullable=False)
    created_at = Column(DateTime, nullable=False, default=utcnow)

    user = relationship("User", back_populates="insight_history")
    import_batch = relationship("ImportBatch", back_populates="insight_history")
