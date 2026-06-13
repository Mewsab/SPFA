from datetime import date, datetime
from decimal import Decimal
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field, field_validator


FinancialHealthStatus = Literal["healthy", "watch", "risk", "no_data"]
RiskLevel = Literal["low", "medium", "high"]
TransactionSourceFilter = Literal["manual", "csv_import", "all"]


class CategoryAmount(BaseModel):
    category: str
    label: str
    amount: Decimal
    percentage: Decimal | None = None


class IncomeExpenseChartItem(BaseModel):
    label: str
    amount: Decimal


class BudgetSuggestion(BaseModel):
    category: str
    label: str
    current_spending: Decimal
    suggested_budget: Decimal
    potential_savings: Decimal
    risk_level: RiskLevel
    reason: str


class SuggestedBudgetChartItem(BaseModel):
    category: str
    label: str
    current_spending: Decimal
    suggested_budget: Decimal
    potential_savings: Decimal


class SourceBreakdown(BaseModel):
    manual: int
    csv_import: int


class HighestExpenseTransaction(BaseModel):
    transaction_id: int
    category: str
    label: str
    amount: Decimal
    transaction_date: date
    description: str | None = None
    source: str
    import_batch_id: int | None = None


class FinancialSummaryResponse(BaseModel):
    total_income: Decimal
    total_expense: Decimal
    balance: Decimal
    transaction_count: int
    income_transaction_count: int
    expense_transaction_count: int
    spending_by_category: list[CategoryAmount]
    income_by_category: list[CategoryAmount]
    top_spending_category: CategoryAmount | None = None
    highest_expense_transaction: HighestExpenseTransaction | None = None
    financial_health_status: FinancialHealthStatus
    financial_health_message: str
    savings_rate_percentage: Decimal
    expense_ratio_percentage: Decimal
    budget_suggestions: list[BudgetSuggestion]
    spending_chart_data: list[CategoryAmount]
    income_expense_chart_data: list[IncomeExpenseChartItem]
    suggested_budget_chart_data: list[SuggestedBudgetChartItem]
    source_breakdown: SourceBreakdown


class AIAdviceTip(BaseModel):
    title: str
    description: str
    category: str | None = None
    impact: RiskLevel


class AIAdviceResponse(BaseModel):
    headline: str
    overall_assessment: str
    priority_level: Literal["healthy", "watch", "risk"]
    tips: list[AIAdviceTip]
    next_steps: list[str]
    disclaimer: str
    generated_from: str = "financial_summary"


class InsightHistoryResponse(BaseModel):
    insight_id: int
    import_batch_id: int | None = None
    headline: str
    priority_level: str
    summary_text: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class AIAdviceRequest(BaseModel):
    source: TransactionSourceFilter | None = None
    import_batch_id: int | None = None
    date_from: date | None = None
    date_to: date | None = None


class AIChatRequest(BaseModel):
    message: str = Field(..., max_length=500)
    source: TransactionSourceFilter | None = None
    import_batch_id: int | None = None
    date_from: date | None = None
    date_to: date | None = None

    @field_validator("message")
    @classmethod
    def validate_message(cls, value: str) -> str:
        message = value.strip()
        if not message:
            raise ValueError("Message cannot be empty.")

        return message


class AIChatResponse(BaseModel):
    response: str
    scope: str = "budgeting_finance"
    used_financial_summary: bool
    suggested_followups: list[str]
    disclaimer: str
