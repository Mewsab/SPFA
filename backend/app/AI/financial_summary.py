from __future__ import annotations

from decimal import Decimal, ROUND_HALF_UP

from app.models.transaction import Transaction
from app.schemas.s_insights import (
    CategoryAmount,
    FinancialSummaryResponse,
    HighestExpenseTransaction,
    IncomeExpenseChartItem,
    SourceBreakdown,
)
from app.utils.options import TRANSACTION_CATEGORY_OPTIONS, TRANSACTION_CATEGORIES
from app.AI.budget_suggestion_engine import (
    build_suggested_budget_chart_data,
    generate_budget_suggestions,
)


HEALTH_MESSAGES = {
    "healthy": "Your spending is within a healthy range based on your income.",
    "watch": "Your spending is manageable, but there is room to improve savings.",
    "risk": "Your expenses are close to or above your income. Review flexible spending categories.",
    "no_data": "Add transactions or upload a CSV statement to generate insights.",
}


def money(value: Decimal) -> Decimal:
    return value.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)


def percentage(value: Decimal) -> Decimal:
    return value.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)


def to_decimal(value) -> Decimal:
    if value is None:
        return Decimal("0.00")

    if isinstance(value, Decimal):
        return value

    return Decimal(str(value))


def category_labels() -> dict[str, str]:
    return {option["value"]: option["label"] for option in TRANSACTION_CATEGORY_OPTIONS}


def initialize_category_totals() -> dict[str, Decimal]:
    return {category: Decimal("0.00") for category in TRANSACTION_CATEGORIES}


def build_category_amounts(
    category_totals: dict[str, Decimal],
    total_amount: Decimal,
    labels: dict[str, str],
) -> list[CategoryAmount]:
    items: list[CategoryAmount] = []

    for category in TRANSACTION_CATEGORIES:
        amount = category_totals.get(category, Decimal("0.00"))
        if amount <= 0:
            continue

        category_percentage = (
            percentage(amount / total_amount * Decimal("100"))
            if total_amount > 0
            else Decimal("0.00")
        )
        items.append(
            CategoryAmount(
                category=category,
                label=labels.get(category, category.title()),
                amount=money(amount),
                percentage=category_percentage,
            )
        )

    return sorted(items, key=lambda item: item.amount, reverse=True)


def calculate_financial_health(
    transaction_count: int,
    total_income: Decimal,
    total_expense: Decimal,
    balance: Decimal,
) -> tuple[str, str, Decimal, Decimal]:
    if transaction_count == 0 or total_income <= 0:
        return "no_data", HEALTH_MESSAGES["no_data"], Decimal("0.00"), Decimal("0.00")

    savings_rate = percentage(balance / total_income * Decimal("100"))
    expense_ratio = percentage(total_expense / total_income * Decimal("100"))

    if balance < 0 or savings_rate < Decimal("5.00"):
        status = "risk"
    elif savings_rate < Decimal("20.00"):
        status = "watch"
    else:
        status = "healthy"

    return status, HEALTH_MESSAGES[status], savings_rate, expense_ratio


def find_highest_expense_transaction(
    transactions: list[Transaction],
    labels: dict[str, str],
) -> HighestExpenseTransaction | None:
    expense_transactions = [
        transaction
        for transaction in transactions
        if transaction.transaction_type == "expense"
    ]
    if not expense_transactions:
        return None

    highest_transaction = max(
        expense_transactions,
        key=lambda transaction: to_decimal(transaction.amount),
    )

    return HighestExpenseTransaction(
        transaction_id=highest_transaction.transaction_id,
        category=highest_transaction.category,
        label=labels.get(highest_transaction.category, highest_transaction.category.title()),
        amount=money(to_decimal(highest_transaction.amount)),
        transaction_date=highest_transaction.transaction_date,
        description=highest_transaction.description,
        source=highest_transaction.source,
        import_batch_id=highest_transaction.import_batch_id,
    )


def calculate_financial_summary(
    transactions: list[Transaction],
) -> FinancialSummaryResponse:
    labels = category_labels()
    spending_totals = initialize_category_totals()
    income_totals = initialize_category_totals()
    total_income = Decimal("0.00")
    total_expense = Decimal("0.00")
    income_transaction_count = 0
    expense_transaction_count = 0
    manual_count = 0
    csv_import_count = 0

    for transaction in transactions:
        amount = to_decimal(transaction.amount)

        if transaction.source == "csv_import":
            csv_import_count += 1
        else:
            manual_count += 1

        if transaction.transaction_type == "income":
            total_income += amount
            income_transaction_count += 1
            income_totals[transaction.category] = income_totals.get(
                transaction.category,
                Decimal("0.00"),
            ) + amount
        elif transaction.transaction_type == "expense":
            total_expense += amount
            expense_transaction_count += 1
            spending_totals[transaction.category] = spending_totals.get(
                transaction.category,
                Decimal("0.00"),
            ) + amount

    balance = total_income - total_expense
    spending_by_category = build_category_amounts(spending_totals, total_expense, labels)
    income_by_category = build_category_amounts(income_totals, total_income, labels)
    top_spending_category = spending_by_category[0] if spending_by_category else None
    top_spending_category_value = (
        top_spending_category.category if top_spending_category else None
    )
    financial_health_status, financial_health_message, savings_rate, expense_ratio = (
        calculate_financial_health(
            len(transactions),
            total_income,
            total_expense,
            balance,
        )
    )
    budget_suggestions = generate_budget_suggestions(
        spending_totals,
        labels,
        top_spending_category_value,
    )

    return FinancialSummaryResponse(
        total_income=money(total_income),
        total_expense=money(total_expense),
        balance=money(balance),
        transaction_count=len(transactions),
        income_transaction_count=income_transaction_count,
        expense_transaction_count=expense_transaction_count,
        spending_by_category=spending_by_category,
        income_by_category=income_by_category,
        top_spending_category=top_spending_category,
        highest_expense_transaction=find_highest_expense_transaction(transactions, labels),
        financial_health_status=financial_health_status,
        financial_health_message=financial_health_message,
        savings_rate_percentage=savings_rate,
        expense_ratio_percentage=expense_ratio,
        budget_suggestions=budget_suggestions,
        spending_chart_data=spending_by_category,
        income_expense_chart_data=[
            IncomeExpenseChartItem(label="Income", amount=money(total_income)),
            IncomeExpenseChartItem(label="Expenses", amount=money(total_expense)),
        ],
        suggested_budget_chart_data=build_suggested_budget_chart_data(budget_suggestions),
        source_breakdown=SourceBreakdown(
            manual=manual_count,
            csv_import=csv_import_count,
        ),
    )
