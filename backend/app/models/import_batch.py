from datetime import UTC, datetime

from sqlalchemy import Column, DateTime, ForeignKey, Integer, String
from sqlalchemy.orm import relationship

from app.core.database import Base


def utcnow() -> datetime:
    return datetime.now(UTC).replace(tzinfo=None)


class ImportBatch(Base):
    __tablename__ = "import_batches"

    import_batch_id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.user_id"), nullable=False, index=True)
    file_name = Column(String(255), nullable=False)
    uploaded_at = Column(DateTime, nullable=False, default=utcnow)
    total_rows = Column(Integer, nullable=False, default=0)
    successful_rows = Column(Integer, nullable=False, default=0)
    failed_rows = Column(Integer, nullable=False, default=0)
    status = Column(String(50), nullable=False, default="completed")

    user = relationship("User", back_populates="import_batches")
    transactions = relationship("Transaction", back_populates="import_batch")
    insight_history = relationship("InsightHistory", back_populates="import_batch")
