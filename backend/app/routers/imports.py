from __future__ import annotations

import csv
from datetime import date, timedelta
from io import StringIO
from random import Random

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from fastapi.responses import Response
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.dependencies import get_current_user
from app.models.user import User
from app.schemas.s_import import CSVImportResponse
from app.services.csv_import_service import (
    CSVImportFileError,
    REQUIRED_COLUMNS,
    import_transactions_from_csv,
)
from app.utils.options import TRANSACTION_CATEGORIES


router = APIRouter(prefix="/imports", tags=["Imports"])


def csv_download_response(content: str, file_name: str) -> Response:
    return Response(
        content=content,
        media_type="text/csv",
        headers={"Content-Disposition": f'attachment; filename="{file_name}"'},
    )


def rows_to_csv(rows: list[dict[str, str]]) -> str:
    output = StringIO()
    writer = csv.DictWriter(output, fieldnames=list(REQUIRED_COLUMNS))
    writer.writeheader()
    writer.writerows(rows)
    return output.getvalue()


def build_sample_rows(row_count: int) -> list[dict[str, str]]:
    random = Random(42)
    descriptions = {
        "food": ["Groceries", "Coffee", "Lunch"],
        "transport": ["Taxi", "Fuel", "Bus fare"],
        "utilities": ["Electricity bill", "Water bill", "Internet bill"],
        "salary": ["Monthly salary", "Freelance payment", "Bonus"],
        "shopping": ["Clothing", "Household items", "Books"],
        "healthcare": ["Pharmacy", "Clinic visit", "Health insurance"],
        "education": ["Course fee", "Textbook", "Workshop"],
        "entertainment": ["Movie tickets", "Streaming subscription", "Concert"],
        "savings": ["Emergency fund", "Savings transfer", "Investment deposit"],
        "other": ["Bank fee", "Gift", "Miscellaneous"],
    }
    today = date.today()
    rows: list[dict[str, str]] = []

    for index in range(row_count):
        if index % 7 == 0:
            category = "salary"
            transaction_type = "income"
            amount = random.randint(450, 1400)
        elif index % 11 == 0:
            category = "savings"
            transaction_type = "income"
            amount = random.randint(40, 200)
        else:
            expense_categories = [
                category
                for category in TRANSACTION_CATEGORIES
                if category not in {"salary", "savings"}
            ]
            category = random.choice(expense_categories)
            transaction_type = "expense"
            amount = random.randint(3, 95)

        rows.append(
            {
                "transaction_date": (today - timedelta(days=index)).isoformat(),
                "description": random.choice(descriptions[category]),
                "category": category,
                "transaction_type": transaction_type,
                "amount": f"{amount}.{random.randint(0, 99):02d}",
            }
        )

    return rows


@router.post("/transactions-csv", response_model=CSVImportResponse)
def import_transactions_csv(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        return import_transactions_from_csv(db, current_user, file)
    except CSVImportFileError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        ) from exc


@router.get("/template")
def download_csv_template(
    current_user: User = Depends(get_current_user),
):
    content = rows_to_csv([])
    return csv_download_response(content, "spfa_transactions_template.csv")


@router.get("/sample-csv")
def download_sample_csv(
    rows: int = 30,
    current_user: User = Depends(get_current_user),
):
    row_count = max(5, min(rows, 100))
    content = rows_to_csv(build_sample_rows(row_count))
    return csv_download_response(content, "spfa_sample_transactions.csv")
