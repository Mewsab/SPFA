from __future__ import annotations

from dataclasses import dataclass
from datetime import date
from decimal import Decimal, InvalidOperation
from io import BytesIO
from pathlib import Path
from typing import Any

import pandas as pd
from fastapi import UploadFile
from pandas.errors import EmptyDataError, ParserError
from sqlalchemy.orm import Session

from app.models.import_batch import ImportBatch
from app.models.transaction import Transaction
from app.models.user import User
from app.schemas.s_import import (
    CSVImportResponse,
    ImportBatchResponse,
    ImportRowError,
)
from app.utils.options import TRANSACTION_CATEGORIES, TRANSACTION_TYPES


REQUIRED_COLUMNS = (
    "transaction_date",
    "description",
    "category",
    "transaction_type",
    "amount",
)
CSV_IMPORT_SOURCE = "csv_import"


class CSVImportFileError(ValueError):
    pass


@dataclass(frozen=True)
class CleanTransactionRow:
    transaction_date: date
    description: str | None
    category: str
    transaction_type: str
    amount: Decimal


def normalize_column_name(column_name: str) -> str:
    return str(column_name).strip().lower().replace(" ", "_")


def normalize_text(value: Any) -> str:
    if value is None:
        return ""

    return str(value).strip()


def parse_transaction_date(value: Any) -> date:
    text_value = normalize_text(value)
    if not text_value:
        raise ValueError("transaction_date is required.")

    try:
        return pd.to_datetime(text_value, errors="raise").date()
    except (TypeError, ValueError, ParserError) as exc:
        raise ValueError("transaction_date must be a valid date.") from exc


def parse_amount(value: Any) -> Decimal:
    text_value = normalize_text(value).replace(",", "")
    if not text_value:
        raise ValueError("amount is required.")

    try:
        amount = Decimal(text_value)
    except (InvalidOperation, ValueError) as exc:
        raise ValueError("amount must be a valid decimal value.") from exc

    if not amount.is_finite():
        raise ValueError("amount must be a valid decimal value.")

    if amount <= 0:
        raise ValueError("amount must be greater than 0.")

    return amount


def clean_transaction_row(row: dict[str, Any]) -> CleanTransactionRow:
    category = normalize_text(row.get("category")).lower()
    transaction_type = normalize_text(row.get("transaction_type")).lower()
    description = normalize_text(row.get("description")) or None

    if category not in TRANSACTION_CATEGORIES:
        raise ValueError("category must be one of the supported transaction categories.")

    if transaction_type not in TRANSACTION_TYPES:
        raise ValueError("transaction_type must be income or expense.")

    return CleanTransactionRow(
        transaction_date=parse_transaction_date(row.get("transaction_date")),
        description=description,
        category=category,
        transaction_type=transaction_type,
        amount=parse_amount(row.get("amount")),
    )


def get_upload_file_name(file: UploadFile) -> str:
    file_name = Path(file.filename or "").name
    if not file_name:
        raise CSVImportFileError("A CSV file is required.")

    if Path(file_name).suffix.lower() != ".csv":
        raise CSVImportFileError("Only CSV files are supported.")

    return file_name


def read_csv_to_dataframe(file: UploadFile) -> pd.DataFrame:
    try:
        file_bytes = file.file.read()
    except OSError as exc:
        raise CSVImportFileError("Unable to read uploaded CSV file.") from exc

    if not file_bytes:
        raise CSVImportFileError("CSV file is empty.")

    try:
        return pd.read_csv(BytesIO(file_bytes), dtype=str, keep_default_na=False)
    except EmptyDataError as exc:
        raise CSVImportFileError("CSV file is empty.") from exc
    except (UnicodeDecodeError, ParserError) as exc:
        raise CSVImportFileError("CSV file could not be parsed.") from exc


def validate_required_columns(df: pd.DataFrame) -> pd.DataFrame:
    df = df.rename(columns={column: normalize_column_name(column) for column in df.columns})
    missing_columns = [column for column in REQUIRED_COLUMNS if column not in df.columns]

    if missing_columns:
        missing_display = ", ".join(missing_columns)
        raise CSVImportFileError(f"CSV is missing required columns: {missing_display}.")

    return df


def import_transactions_from_csv(
    db: Session,
    current_user: User,
    file: UploadFile,
) -> CSVImportResponse:
    file_name = get_upload_file_name(file)
    df = validate_required_columns(read_csv_to_dataframe(file))

    import_batch = ImportBatch(
        user_id=current_user.user_id,
        file_name=file_name,
        total_rows=len(df),
        successful_rows=0,
        failed_rows=0,
        status="completed",
    )
    db.add(import_batch)
    db.flush()

    errors: list[ImportRowError] = []
    imported_transactions: list[Transaction] = []

    for row_index, row in df.iterrows():
        raw_data = {column: normalize_text(row[column]) for column in df.columns}

        try:
            clean_row = clean_transaction_row(raw_data)
        except ValueError as exc:
            errors.append(
                ImportRowError(
                    row_number=int(row_index) + 2,
                    reason=str(exc),
                    raw_data=raw_data,
                )
            )
            continue

        imported_transactions.append(
            Transaction(
                user_id=current_user.user_id,
                amount=clean_row.amount,
                category=clean_row.category,
                transaction_date=clean_row.transaction_date,
                description=clean_row.description,
                transaction_type=clean_row.transaction_type,
                source=CSV_IMPORT_SOURCE,
                import_batch_id=import_batch.import_batch_id,
            )
        )

    db.add_all(imported_transactions)

    import_batch.successful_rows = len(imported_transactions)
    import_batch.failed_rows = len(errors)
    if errors:
        import_batch.status = "completed_with_errors"
    else:
        import_batch.status = "completed"

    db.commit()
    db.refresh(import_batch)

    imported_count = len(imported_transactions)
    failed_count = len(errors)
    if imported_count and failed_count:
        message = "CSV import completed with some row errors."
    elif imported_count:
        message = "CSV import completed successfully."
    else:
        message = "CSV import completed, but no rows were imported."

    return CSVImportResponse(
        import_batch=ImportBatchResponse.model_validate(import_batch),
        imported_transactions_count=imported_count,
        failed_rows_count=failed_count,
        errors=errors,
        message=message,
    )
