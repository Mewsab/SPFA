from datetime import UTC, date, datetime
from decimal import Decimal, ROUND_HALF_UP

from sqlalchemy import func
from sqlalchemy.orm import Session

from app.models.budget import Budget
from app.models.transaction import Transaction
from app.models.user import User
from app.schemas.s_budget import (
    BudgetChartDataItem,
    BudgetCreate,
    BudgetOverviewItem,
    BudgetOverviewResponse,
    BudgetUpdate,
    validate_budget_date_range,
)
from app.utils.options import TRANSACTION_CATEGORY_OPTIONS


BUDGET_OVERLAP_MESSAGE = (
    "A budget already exists for this category within the selected date range."
)


class BudgetOverlapError(ValueError):
    pass


def utcnow() -> datetime:
    return datetime.now(UTC).replace(tzinfo=None)


def to_decimal(value) -> Decimal:
    if value is None:
        return Decimal("0.00")

    if isinstance(value, Decimal):
        return value

    return Decimal(str(value))


def money(value: Decimal) -> Decimal:
    return value.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)


def calculate_usage_percentage(spent_amount: Decimal, limit_amount: Decimal) -> Decimal:
    if limit_amount <= 0:
        return Decimal("0.00")

    return spent_amount / limit_amount * Decimal("100")


def calculate_budget_status(usage_percentage: Decimal) -> str:
    if usage_percentage < Decimal("80"):
        return "within_limit"

    if usage_percentage <= Decimal("100"):
        return "near_limit"

    return "exceeded"


def calculate_forecast_status(projected_usage_percentage: Decimal) -> str:
    if projected_usage_percentage < Decimal("80"):
        return "safe"

    if projected_usage_percentage <= Decimal("100"):
        return "watch"

    return "risk"


def calculate_budget_days(
    start_date: date,
    end_date: date,
    today: date,
) -> tuple[int, int, int]:
    total_period_days = max((end_date - start_date).days + 1, 1)

    if today < start_date:
        return 0, total_period_days, total_period_days

    if today > end_date:
        return total_period_days, 0, total_period_days

    days_elapsed = min((today - start_date).days + 1, total_period_days)
    days_remaining = max((end_date - today).days, 0)
    return days_elapsed, days_remaining, total_period_days


def calculate_projected_spending(
    spent_amount: Decimal,
    days_elapsed: int,
    total_period_days: int,
) -> Decimal:
    if days_elapsed <= 0:
        return spent_amount

    daily_spend_rate = spent_amount / Decimal(days_elapsed)
    return daily_spend_rate * Decimal(total_period_days)


def format_category_label(category: str) -> str:
    for option in TRANSACTION_CATEGORY_OPTIONS:
        if option["value"] == category:
            return option["label"]

    return category.replace("_", " ").title()


def calculate_alert(
    category_label: str,
    status: str,
    forecast_status: str,
    spent_amount: Decimal,
    projected_remaining: Decimal,
) -> tuple[str, str]:
    if status == "exceeded":
        return "danger", f"{category_label} spending has exceeded the budget limit."

    if forecast_status == "risk":
        projected_overage = money(abs(projected_remaining))
        return (
            "danger",
            f"{category_label} is projected to exceed the budget by OMR {projected_overage}.",
        )

    if status == "near_limit":
        return "warning", f"{category_label} spending is approaching the budget limit."

    if forecast_status == "watch":
        return "warning", f"{category_label} is projected to approach the budget limit."

    if spent_amount > 0:
        return "info", f"{category_label} budget is within a healthy range."

    return "none", f"{category_label} has no spending recorded for this budget yet."


def has_overlapping_budget(
    db: Session,
    current_user: User,
    category: str,
    start_date,
    end_date,
    exclude_budget_id: int | None = None,
) -> bool:
    query = db.query(Budget).filter(
        Budget.user_id == current_user.user_id,
        Budget.category == category.strip().lower(),
        Budget.start_date <= end_date,
        Budget.end_date >= start_date,
    )

    if exclude_budget_id is not None:
        query = query.filter(Budget.budget_id != exclude_budget_id)

    return query.first() is not None


def create_budget(
    db: Session,
    current_user: User,
    budget_data: BudgetCreate,
) -> Budget:
    if has_overlapping_budget(
        db,
        current_user,
        budget_data.category,
        budget_data.start_date,
        budget_data.end_date,
    ):
        raise BudgetOverlapError(BUDGET_OVERLAP_MESSAGE)

    new_budget = Budget(
        user_id=current_user.user_id,
        **budget_data.model_dump(),
    )

    db.add(new_budget)
    db.commit()
    db.refresh(new_budget)
    return new_budget


def get_budgets(
    db: Session,
    current_user: User,
    category: str | None = None,
    period_type: str | None = None,
) -> list[Budget]:
    query = db.query(Budget).filter(Budget.user_id == current_user.user_id)

    if category:
        query = query.filter(Budget.category == category.strip().lower())

    if period_type:
        query = query.filter(Budget.period_type == period_type.strip().lower())

    return query.order_by(Budget.created_at.desc()).all()


def get_budget_by_id(
    db: Session,
    current_user: User,
    budget_id: int,
) -> Budget | None:
    return (
        db.query(Budget)
        .filter(
            Budget.budget_id == budget_id,
            Budget.user_id == current_user.user_id,
        )
        .first()
    )


def update_budget(
    db: Session,
    current_user: User,
    budget_id: int,
    budget_data: BudgetUpdate,
) -> Budget | None:
    budget = get_budget_by_id(db, current_user, budget_id)
    if not budget:
        return None

    updates = budget_data.model_dump(exclude_unset=True)
    next_category = updates.get("category", budget.category)
    next_period_type = updates.get("period_type", budget.period_type)
    next_start_date = updates.get("start_date", budget.start_date)
    next_end_date = updates.get("end_date", budget.end_date)
    validate_budget_date_range(next_period_type, next_start_date, next_end_date)

    if has_overlapping_budget(
        db,
        current_user,
        next_category,
        next_start_date,
        next_end_date,
        exclude_budget_id=budget.budget_id,
    ):
        raise BudgetOverlapError(BUDGET_OVERLAP_MESSAGE)

    for field_name, value in updates.items():
        setattr(budget, field_name, value)

    budget.updated_at = utcnow()
    db.commit()
    db.refresh(budget)
    return budget


def delete_budget(
    db: Session,
    current_user: User,
    budget_id: int,
) -> bool:
    budget = get_budget_by_id(db, current_user, budget_id)
    if not budget:
        return False

    db.delete(budget)
    db.commit()
    return True


def get_budget_overview(db: Session, current_user: User) -> BudgetOverviewResponse:
    budgets = get_budgets(db, current_user)

    overview_items: list[BudgetOverviewItem] = []
    chart_data: list[BudgetChartDataItem] = []
    total_budget_limit = Decimal("0.00")
    total_spent = Decimal("0.00")
    total_projected_spending = Decimal("0.00")
    exceeded_count = 0
    near_limit_count = 0
    alert_count = 0
    has_forecast_risk = False
    has_forecast_watch = False
    highest_risk_category = None
    highest_risk_score = Decimal("-1")
    today = date.today()

    for budget in budgets:
        spent_amount = to_decimal(
            db.query(func.sum(Transaction.amount))
            .filter(
                Transaction.user_id == current_user.user_id,
                Transaction.category == budget.category,
                Transaction.transaction_type == "expense",
                Transaction.transaction_date >= budget.start_date,
                Transaction.transaction_date <= budget.end_date,
            )
            .scalar()
        )
        limit_amount = to_decimal(budget.limit_amount)
        remaining_amount = limit_amount - spent_amount
        usage_percentage = calculate_usage_percentage(spent_amount, limit_amount)
        status = calculate_budget_status(usage_percentage)
        days_elapsed, days_remaining, total_period_days = calculate_budget_days(
            budget.start_date,
            budget.end_date,
            today,
        )
        projected_spending = calculate_projected_spending(
            spent_amount,
            days_elapsed,
            total_period_days,
        )
        projected_remaining = limit_amount - projected_spending
        projected_usage_percentage = calculate_usage_percentage(
            projected_spending,
            limit_amount,
        )
        forecast_status = calculate_forecast_status(projected_usage_percentage)
        category_label = format_category_label(budget.category)
        alert_level, alert_message = calculate_alert(
            category_label,
            status,
            forecast_status,
            spent_amount,
            projected_remaining,
        )

        if status == "near_limit":
            near_limit_count += 1
        elif status == "exceeded":
            exceeded_count += 1

        if forecast_status == "risk":
            has_forecast_risk = True
        elif forecast_status == "watch":
            has_forecast_watch = True

        if alert_level in {"warning", "danger"}:
            alert_count += 1

        risk_score = max(usage_percentage, projected_usage_percentage)
        if risk_score > highest_risk_score:
            highest_risk_score = risk_score
            highest_risk_category = budget.category

        total_budget_limit += limit_amount
        total_spent += spent_amount
        total_projected_spending += projected_spending

        overview_items.append(
            BudgetOverviewItem(
                budget_id=budget.budget_id,
                category=budget.category,
                limit_amount=money(limit_amount),
                spent_amount=money(spent_amount),
                remaining_amount=money(remaining_amount),
                usage_percentage=money(usage_percentage),
                status=status,
                period_type=budget.period_type,
                start_date=budget.start_date,
                end_date=budget.end_date,
                days_elapsed=days_elapsed,
                days_remaining=days_remaining,
                projected_spending=money(projected_spending),
                projected_remaining=money(projected_remaining),
                forecast_status=forecast_status,
                alert_level=alert_level,
                alert_message=alert_message,
            )
        )
        chart_data.append(
            BudgetChartDataItem(
                category=budget.category,
                label=category_label,
                limit_amount=money(limit_amount),
                spent_amount=money(spent_amount),
                remaining_amount=money(remaining_amount),
                projected_spending=money(projected_spending),
                usage_percentage=money(usage_percentage),
                status=status,
                forecast_status=forecast_status,
            )
        )

    total_remaining = total_budget_limit - total_spent
    total_projected_remaining = total_budget_limit - total_projected_spending

    if exceeded_count > 0 or has_forecast_risk:
        overall_budget_status = "risk"
    elif near_limit_count > 0 or has_forecast_watch:
        overall_budget_status = "watch"
    else:
        overall_budget_status = "healthy"

    return BudgetOverviewResponse(
        budgets=overview_items,
        total_budget_limit=money(total_budget_limit),
        total_spent=money(total_spent),
        total_remaining=money(total_remaining),
        exceeded_count=exceeded_count,
        near_limit_count=near_limit_count,
        total_projected_spending=money(total_projected_spending),
        projected_remaining=money(total_projected_remaining),
        alert_count=alert_count,
        highest_risk_category=highest_risk_category,
        overall_budget_status=overall_budget_status,
        chart_data=chart_data,
    )
