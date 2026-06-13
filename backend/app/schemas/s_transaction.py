from datetime import date, datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict, Field, field_validator

from app.utils.options import (
    TRANSACTION_CATEGORIES as TRANSACTION_CATEGORY_VALUES,
    TRANSACTION_CATEGORY_OPTIONS,
    TRANSACTION_TYPES as TRANSACTION_TYPE_VALUES,
    TRANSACTION_TYPE_OPTIONS,
    TransactionCategory,
    TransactionType,
)


class TransactionBase(BaseModel):
    amount: Decimal = Field(gt=0)
    category: TransactionCategory
    transaction_date: date
    description: str | None = None
    transaction_type: TransactionType

    @field_validator("category", mode="before")
    @classmethod
    def validate_category(cls, value: str) -> str:
        if not isinstance(value, str):
            raise ValueError("category must be a string.")

        return value.strip().lower()

    @field_validator("description")
    @classmethod
    def normalize_description(cls, value: str | None) -> str | None:
        if value is None:
            return None

        stripped_value = value.strip()
        return stripped_value or None


class TransactionCreate(TransactionBase):
    pass


class TransactionUpdate(BaseModel):
    amount: Decimal | None = Field(default=None, gt=0)
    category: TransactionCategory | None = None
    transaction_date: date | None = None
    description: str | None = None
    transaction_type: TransactionType | None = None

    @field_validator("category", mode="before")
    @classmethod
    def validate_category(cls, value: str | None) -> str | None:
        if value is None:
            return None

        if not isinstance(value, str):
            raise ValueError("category must be a string.")

        return value.strip().lower()

    @field_validator("description")
    @classmethod
    def normalize_description(cls, value: str | None) -> str | None:
        if value is None:
            return None

        stripped_value = value.strip()
        return stripped_value or None


class TransactionResponse(TransactionBase):
    transaction_id: int
    user_id: int
    source: str = "manual"
    import_batch_id: int | None = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class TransactionSummary(BaseModel):
    total_income: Decimal
    total_expense: Decimal
    balance: Decimal
    transaction_count: int


class TransactionTypeOption(BaseModel):
    label: str
    value: TransactionType


class TransactionTypeListResponse(BaseModel):
    transaction_types: list[TransactionTypeOption]


class TransactionCategoryOption(BaseModel):
    label: str
    value: TransactionCategory


class TransactionCategoryListResponse(BaseModel):
    categories: list[TransactionCategoryOption]
