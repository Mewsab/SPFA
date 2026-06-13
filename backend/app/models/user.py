from sqlalchemy import Column, Integer, String
from sqlalchemy.orm import relationship

from app.core.database import Base
from app.utils.roles import ROLE_USER

class User(Base):
    __tablename__ = "users"

    user_id = Column(Integer, primary_key=True, index=True)
    first_name = Column(String(100), nullable=False)
    last_name = Column(String(100), nullable=False)
    email = Column(String(200), unique=True, index=True, nullable=False)
    hashed_password = Column(String(200), nullable=False)
    role = Column(String(50), default=ROLE_USER, nullable=False)
    phone_number = Column(String(30), nullable=True)
    occupation_type = Column(String(50), default="other", nullable=False)

    transactions = relationship(
        "Transaction",
        back_populates="user",
        cascade="all, delete-orphan",
    )
    budgets = relationship(
        "Budget",
        back_populates="user",
        cascade="all, delete-orphan",
    )
    import_batches = relationship(
        "ImportBatch",
        back_populates="user",
        cascade="all, delete-orphan",
    )
    insight_history = relationship(
        "InsightHistory",
        back_populates="user",
        cascade="all, delete-orphan",
    )
