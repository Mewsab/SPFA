from __future__ import annotations

from decimal import Decimal, ROUND_HALF_UP

from app.schemas.s_insights import BudgetSuggestion, SuggestedBudgetChartItem


FLEXIBLE_CATEGORIES = {"food", "shopping", "entertainment"}
SEMI_FLEXIBLE_CATEGORIES = {"transport", "utilities", "healthcare", "education"}
SAVINGS_CATEGORY = "savings"
OTHER_CATEGORY = "other"


def money(value: Decimal) -> Decimal:
    return value.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)


def suggestion_rate_for_category(category: str) -> Decimal:
    if category in FLEXIBLE_CATEGORIES:
        return Decimal("0.85")

    if category in SEMI_FLEXIBLE_CATEGORIES:
        return Decimal("0.95")

    if category == SAVINGS_CATEGORY:
        return Decimal("1.00")

    if category == OTHER_CATEGORY:
        return Decimal("0.90")

    return Decimal("0.95")


def calculate_risk_level(
    category: str,
    potential_savings: Decimal,
    top_spending_category: str | None,
) -> str:
    if potential_savings >= Decimal("20.00") or category == top_spending_category:
        return "high"

    if potential_savings >= Decimal("5.00"):
        return "medium"

    return "low"


def build_reason(
    category: str,
    label: str,
    current_spending: Decimal,
    suggested_budget: Decimal,
) -> str:
    if category in FLEXIBLE_CATEGORIES:
        return (
            f"{label} is flexible spending, so a modest reduction from "
            f"OMR {current_spending} to OMR {suggested_budget} may improve savings."
        )

    if category in SEMI_FLEXIBLE_CATEGORIES:
        return (
            f"{label} is semi-flexible, so the suggestion stays close to current "
            f"spending while trimming avoidable costs."
        )

    if category == SAVINGS_CATEGORY:
        return "Savings is generally beneficial, so the suggestion keeps this category stable."

    return f"{label} spending may include mixed expenses, so a small reduction is suggested."


def generate_budget_suggestions(
    spending_by_category: dict[str, Decimal],
    category_labels: dict[str, str],
    top_spending_category: str | None,
) -> list[BudgetSuggestion]:
    suggestions: list[BudgetSuggestion] = []

    for category, current_spending in sorted(
        spending_by_category.items(),
        key=lambda item: item[1],
        reverse=True,
    ):
        if current_spending <= 0:
            continue

        suggested_budget = money(max(current_spending * suggestion_rate_for_category(category), Decimal("0.00")))
        potential_savings = money(max(current_spending - suggested_budget, Decimal("0.00")))
        label = category_labels.get(category, category.replace("_", " ").title())

        suggestions.append(
            BudgetSuggestion(
                category=category,
                label=label,
                current_spending=money(current_spending),
                suggested_budget=suggested_budget,
                potential_savings=potential_savings,
                risk_level=calculate_risk_level(
                    category,
                    potential_savings,
                    top_spending_category,
                ),
                reason=build_reason(category, label, money(current_spending), suggested_budget),
            )
        )

    return suggestions


def build_suggested_budget_chart_data(
    suggestions: list[BudgetSuggestion],
) -> list[SuggestedBudgetChartItem]:
    return [
        SuggestedBudgetChartItem(
            category=suggestion.category,
            label=suggestion.label,
            current_spending=suggestion.current_spending,
            suggested_budget=suggestion.suggested_budget,
            potential_savings=suggestion.potential_savings,
        )
        for suggestion in suggestions
    ]
