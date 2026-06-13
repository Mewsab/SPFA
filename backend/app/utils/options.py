from typing import Literal


TransactionCategory = Literal[
    "food",
    "transport",
    "utilities",
    "salary",
    "shopping",
    "healthcare",
    "education",
    "entertainment",
    "savings",
    "other",
]
TRANSACTION_CATEGORIES: tuple[TransactionCategory, ...] = (
    "food",
    "transport",
    "utilities",
    "salary",
    "shopping",
    "healthcare",
    "education",
    "entertainment",
    "savings",
    "other",
)
TRANSACTION_CATEGORY_OPTIONS = [
    {"label": "Food", "value": "food"},
    {"label": "Transport", "value": "transport"},
    {"label": "Utilities", "value": "utilities"},
    {"label": "Salary", "value": "salary"},
    {"label": "Shopping", "value": "shopping"},
    {"label": "Healthcare", "value": "healthcare"},
    {"label": "Education", "value": "education"},
    {"label": "Entertainment", "value": "entertainment"},
    {"label": "Savings", "value": "savings"},
    {"label": "Other", "value": "other"},
]

TransactionType = Literal["income", "expense"]
TRANSACTION_TYPES: tuple[TransactionType, ...] = ("income", "expense")
TRANSACTION_TYPE_OPTIONS = [
    {"label": "Income", "value": "income"},
    {"label": "Expense", "value": "expense"},
]

BudgetPeriodType = Literal["weekly", "monthly", "yearly", "custom"]
BUDGET_PERIOD_TYPES: tuple[BudgetPeriodType, ...] = (
    "weekly",
    "monthly",
    "yearly",
    "custom",
)
BUDGET_PERIOD_TYPE_OPTIONS = [
    {"label": "Weekly", "value": "weekly"},
    {"label": "Monthly", "value": "monthly"},
    {"label": "Yearly", "value": "yearly"},
    {"label": "Custom", "value": "custom"},
]
