from fastapi import APIRouter, Depends, HTTPException, status

from app.dependencies import get_current_user
from app.models.user import User
from app.schemas.s_invest import (
    InvestmentHistoryResponse,
    InvestmentOption,
    InvestmentQuoteResponse,
)
from app.services.investment_service import (
    InvestmentSymbolNotFoundError,
    MarketDataNotConfiguredError,
    MarketDataUnavailableError,
    get_investment_options,
    get_stock_history_debug_summary,
    get_stock_history,
    get_stock_quote,
)


router = APIRouter(prefix="/investments", tags=["Investments"])


@router.get("/options", response_model=list[InvestmentOption])
def get_investment_options_endpoint(
    current_user: User = Depends(get_current_user),
):
    return get_investment_options()


@router.get("/quote/{symbol}", response_model=InvestmentQuoteResponse)
def get_stock_quote_endpoint(
    symbol: str,
    current_user: User = Depends(get_current_user),
):
    try:
        return get_stock_quote(symbol)
    except InvestmentSymbolNotFoundError as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Investment symbol is not supported.",
        ) from exc
    except MarketDataNotConfiguredError as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Market data service is not configured.",
        ) from exc
    except MarketDataUnavailableError as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Market data is temporarily unavailable.",
        ) from exc


@router.get("/history/{symbol}", response_model=InvestmentHistoryResponse)
def get_stock_history_endpoint(
    symbol: str,
    current_user: User = Depends(get_current_user),
):
    try:
        return get_stock_history(symbol)
    except InvestmentSymbolNotFoundError as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Investment symbol is not supported.",
        ) from exc
    except MarketDataNotConfiguredError as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Market data service is not configured.",
        ) from exc
    except MarketDataUnavailableError as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Market data is temporarily unavailable.",
        ) from exc


@router.get("/debug/history/{symbol}")
def get_stock_history_debug_endpoint(
    symbol: str,
    current_user: User = Depends(get_current_user),
):
    try:
        return get_stock_history_debug_summary(symbol)
    except InvestmentSymbolNotFoundError as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Investment symbol is not supported.",
        ) from exc
