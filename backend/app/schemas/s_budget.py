from datetime import date, datetime
from decimal import Decimal
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator

from app.utils.options import BudgetPeriodType, TransactionCategory


BudgetStatus = Literal["within_limit", "near_limit", "exceeded"]
BudgetForecastStatus = Literal["safe", "watch", "risk"]
BudgetAlertLevel = Literal["none", "info", "warning", "danger"]
OverallBudgetStatus = Literal["healthy", "watch", "risk"]


def validate_budget_date_range(
    period_type: BudgetPeriodType,
    start_date: date,
    end_date: date,
) -> None:
    if end_date < start_date:
        raise ValueError("end_date must be greater than or equal to start_date.")

    if period_type in {"weekly", "monthly", "yearly"} and end_date == start_date:
        raise ValueError(
            "end_date must be greater than start_date for weekly, monthly, and yearly budgets."
        )


class BudgetBase(BaseModel):
    category: TransactionCategory
    limit_amount: Decimal = Field(gt=0)
    period_type: BudgetPeriodType
    start_date: date
    end_date: date

    @field_validator("category", "period_type", mode="before")
    @classmethod
    def normalize_controlled_value(cls, value: str) -> str:
        if not isinstance(value, str):
            raise ValueError("controlled values must be strings.")

        return value.strip().lower()

    @model_validator(mode="after")
    def validate_date_range(self):
        validate_budget_date_range(
            self.period_type,
            self.start_date,
            self.end_date,
        )
        return self


class BudgetCreate(BudgetBase):
    pass


class BudgetUpdate(BaseModel):
    category: TransactionCategory | None = None
    limit_amount: Decimal | None = Field(default=None, gt=0)
    period_type: BudgetPeriodType | None = None
    start_date: date | None = None
    end_date: date | None = None

    @field_validator("category", "period_type", mode="before")
    @classmethod
    def normalize_controlled_value(cls, value: str | None) -> str | None:
        if value is None:
            return None

        if not isinstance(value, str):
            raise ValueError("controlled values must be strings.")

        return value.strip().lower()

    @model_validator(mode="after")
    def validate_date_range(self):
        if (
            self.period_type is not None
            and self.start_date is not None
            and self.end_date is not None
        ):
            validate_budget_date_range(
                self.period_type,
                self.start_date,
                self.end_date,
            )

        return self


class BudgetResponse(BaseModel):
    budget_id: int
    user_id: int
    category: str
    limit_amount: Decimal
    period_type: str
    start_date: date
    end_date: date
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class BudgetOverviewItem(BaseModel):
    budget_id: int
    category: TransactionCategory
    limit_amount: Decimal
    spent_amount: Decimal
    remaining_amount: Decimal
    usage_percentage: Decimal
    status: BudgetStatus
    period_type: BudgetPeriodType
    start_date: date
    end_date: date
    days_elapsed: int
    days_remaining: int
    projected_spending: Decimal
    projected_remaining: Decimal
    forecast_status: BudgetForecastStatus
    alert_level: BudgetAlertLevel
    alert_message: str


class BudgetChartDataItem(BaseModel):
    category: str
    label: str
    limit_amount: Decimal
    spent_amount: Decimal
    remaining_amount: Decimal
    projected_spending: Decimal
    usage_percentage: Decimal
    status: BudgetStatus
    forecast_status: BudgetForecastStatus


class BudgetOverviewResponse(BaseModel):
    budgets: list[BudgetOverviewItem]
    total_budget_limit: Decimal
    total_spent: Decimal
    total_remaining: Decimal
    exceeded_count: int
    near_limit_count: int
    total_projected_spending: Decimal
    projected_remaining: Decimal
    alert_count: int
    highest_risk_category: str | None
    overall_budget_status: OverallBudgetStatus
    chart_data: list[BudgetChartDataItem]


class BudgetPeriodTypeOption(BaseModel):
    label: str
    value: BudgetPeriodType


class BudgetPeriodTypeListResponse(BaseModel):
    period_types: list[BudgetPeriodTypeOption]
