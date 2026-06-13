from collections.abc import Mapping

import requests

from app.core.config import settings
from app.schemas.s_invest import (
    InvestmentHistoryPoint,
    InvestmentHistoryResponse,
    InvestmentOption,
    InvestmentQuoteResponse,
)


ALPHA_VANTAGE_URL = "https://www.alphavantage.co/query"
REQUEST_TIMEOUT_SECONDS = 10

_INVESTMENT_OPTIONS = {
    "AAPL": InvestmentOption(symbol="AAPL", name="Apple Inc.", asset_type="stock"),
    "MSFT": InvestmentOption(
        symbol="MSFT",
        name="Microsoft Corporation",
        asset_type="stock",
    ),
    "GOOGL": InvestmentOption(symbol="GOOGL", name="Alphabet Inc.", asset_type="stock"),
    "AMZN": InvestmentOption(symbol="AMZN", name="Amazon.com Inc.", asset_type="stock"),
    "TSLA": InvestmentOption(symbol="TSLA", name="Tesla Inc.", asset_type="stock"),
}


class InvestmentSymbolNotFoundError(ValueError):
    pass


class MarketDataNotConfiguredError(RuntimeError):
    pass


class MarketDataUnavailableError(RuntimeError):
    pass


def get_investment_options() -> list[InvestmentOption]:
    return list(_INVESTMENT_OPTIONS.values())


def get_stock_quote(symbol: str) -> InvestmentQuoteResponse:
    option = _get_option(symbol)
    payload = _call_alpha_vantage(
        {
            "function": "GLOBAL_QUOTE",
            "symbol": option.symbol,
        }
    )

    quote = payload.get("Global Quote")
    if not isinstance(quote, Mapping) or _has_alpha_vantage_error(payload):
        raise MarketDataUnavailableError("Market data is temporarily unavailable.")

    return InvestmentQuoteResponse(
        symbol=option.symbol,
        name=option.name,
        asset_type=option.asset_type,
        price=_parse_float(quote.get("05. price")),
        change=_parse_float(quote.get("09. change")),
        change_percent=_parse_optional_string(quote.get("10. change percent")),
        last_updated=_parse_optional_string(quote.get("07. latest trading day")),
        provider=settings.MARKET_API_PROVIDER,
    )


def get_stock_history(symbol: str) -> InvestmentHistoryResponse:
    option = _get_option(symbol)
    payload = _call_alpha_vantage(
        {
            "function": "TIME_SERIES_DAILY",
            "symbol": option.symbol,
            "outputsize": "compact",
        }
    )

    time_series = payload.get("Time Series (Daily)")
    if not isinstance(time_series, Mapping) or _has_alpha_vantage_error(payload):
        raise MarketDataUnavailableError("Market data is temporarily unavailable.")

    latest_dates = sorted(time_series.keys(), reverse=True)[:30]
    history = [
        InvestmentHistoryPoint(
            date=day,
            close=_required_float(time_series[day].get("4. close")),
        )
        for day in reversed(latest_dates)
        if isinstance(time_series[day], Mapping)
    ]

    if not history:
        raise MarketDataUnavailableError("Market data is temporarily unavailable.")

    return InvestmentHistoryResponse(
        symbol=option.symbol,
        name=option.name,
        asset_type=option.asset_type,
        provider=settings.MARKET_API_PROVIDER,
        history=history,
    )


def _get_option(symbol: str) -> InvestmentOption:
    normalized_symbol = symbol.upper()
    option = _INVESTMENT_OPTIONS.get(normalized_symbol)
    if option is None:
        raise InvestmentSymbolNotFoundError("Investment symbol is not supported.")

    return option


def _call_alpha_vantage(params: dict[str, str]) -> dict:
    if settings.MARKET_API_PROVIDER != "alpha_vantage":
        raise MarketDataUnavailableError("Market data is temporarily unavailable.")

    if not settings.ALPHA_VANTAGE_API_KEY:
        raise MarketDataNotConfiguredError("Market data service is not configured.")

    try:
        response = requests.get(
            ALPHA_VANTAGE_URL,
            params={**params, "apikey": settings.ALPHA_VANTAGE_API_KEY},
            timeout=REQUEST_TIMEOUT_SECONDS,
        )
        response.raise_for_status()
        payload = response.json()
    except (requests.RequestException, ValueError) as exc:
        raise MarketDataUnavailableError(
            "Market data is temporarily unavailable."
        ) from exc

    if not isinstance(payload, dict) or _has_alpha_vantage_error(payload):
        raise MarketDataUnavailableError("Market data is temporarily unavailable.")

    return payload


def _has_alpha_vantage_error(payload: dict) -> bool:
    return any(key in payload for key in ("Note", "Information", "Error Message"))


def _parse_optional_string(value: object) -> str | None:
    if value is None:
        return None

    parsed = str(value).strip()
    return parsed or None


def _parse_float(value: object) -> float | None:
    if value is None:
        return None

    try:
        return float(value)
    except (TypeError, ValueError):
        return None


def _required_float(value: object) -> float:
    parsed = _parse_float(value)
    if parsed is None:
        raise MarketDataUnavailableError("Market data is temporarily unavailable.")

    return parsed
