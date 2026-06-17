from collections.abc import Mapping
import logging

import requests

from app.core.config import settings
from app.schemas.s_invest import (
    InvestmentHistoryPoint,
    InvestmentHistoryResponse,
    InvestmentOption,
    InvestmentQuoteResponse,
)

logger = logging.getLogger(__name__)

ALPHA_VANTAGE_URL = "https://www.alphavantage.co/query"
REQUEST_TIMEOUT_SECONDS = 10
TIME_SERIES_DAILY_KEY = "Time Series (Daily)"

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
    _log_history_request_start(symbol)
    option = _get_option(symbol)
    payload = _call_alpha_vantage(
        {
            "function": "TIME_SERIES_DAILY",
            "symbol": option.symbol,
            "outputsize": "compact",
        }
    )

    error_key = _alpha_vantage_error_key(payload)
    if error_key:
        logger.warning("Returning 503: Alpha Vantage returned %s", error_key)
        raise MarketDataUnavailableError("Market data is temporarily unavailable.")

    time_series = payload.get(TIME_SERIES_DAILY_KEY)
    if not isinstance(time_series, Mapping):
        logger.warning("Returning 503: Time Series (Daily) missing")
        raise MarketDataUnavailableError("Market data is temporarily unavailable.")

    logger.info(
        "Alpha Vantage daily records: count=%s first_dates=%s",
        len(time_series),
        list(time_series.keys())[:3],
    )
    history = _parse_history_points(time_series)
    logger.info(
        "Parsed investment history: points=%s first_point=%s last_point=%s",
        len(history),
        history[0].model_dump() if history else None,
        history[-1].model_dump() if history else None,
    )

    if not history:
        logger.warning("Returning 503: parsed history is empty")
        raise MarketDataUnavailableError("Market data is temporarily unavailable.")

    return InvestmentHistoryResponse(
        symbol=option.symbol,
        name=option.name,
        asset_type=option.asset_type,
        provider=settings.MARKET_API_PROVIDER,
        history=history,
    )


def get_stock_history_debug_summary(symbol: str) -> dict:
    _log_history_request_start(symbol)
    option = _get_option(symbol)
    summary = _base_history_debug_summary(option.symbol)

    try:
        payload, http_status = _request_alpha_vantage_payload(
            {
                "function": "TIME_SERIES_DAILY",
                "symbol": option.symbol,
                "outputsize": "compact",
            }
        )
    except MarketDataNotConfiguredError:
        logger.warning("Returning 503: missing Alpha Vantage API key")
        summary["debug_reason"] = "missing_api_key"
        return summary
    except MarketDataUnavailableError as exc:
        summary["debug_reason"] = str(exc) or "request_exception"
        return summary

    summary["http_status"] = http_status
    if not isinstance(payload, dict):
        summary["debug_reason"] = "payload_not_object"
        return summary

    summary.update(_payload_debug_summary(payload))
    time_series = payload.get(TIME_SERIES_DAILY_KEY)
    if isinstance(time_series, Mapping):
        summary["raw_time_series_count"] = len(time_series)
        try:
            parsed_history = _parse_history_points(time_series)
            summary["parsed_points_count"] = len(parsed_history)
            summary["debug_reason"] = "success" if parsed_history else "parsed_history_empty"
        except MarketDataUnavailableError as exc:
            summary["debug_reason"] = f"parser_error:{exc.__class__.__name__}"
    elif summary["has_note"]:
        summary["debug_reason"] = "alpha_vantage_note"
    elif summary["has_information"]:
        summary["debug_reason"] = "alpha_vantage_information"
    elif summary["has_error_message"]:
        summary["debug_reason"] = "alpha_vantage_error_message"
    else:
        summary["debug_reason"] = "time_series_daily_missing"

    return summary


def _get_option(symbol: str) -> InvestmentOption:
    normalized_symbol = symbol.upper()
    option = _INVESTMENT_OPTIONS.get(normalized_symbol)
    if option is None:
        raise InvestmentSymbolNotFoundError("Investment symbol is not supported.")

    return option


def _call_alpha_vantage(params: dict[str, str]) -> dict:
    payload, _http_status = _request_alpha_vantage_payload(params)

    if not isinstance(payload, dict):
        logger.warning("Returning 503: Alpha Vantage payload was not a JSON object")
        raise MarketDataUnavailableError("Market data is temporarily unavailable.")

    error_key = _alpha_vantage_error_key(payload)
    if error_key:
        logger.warning("Returning 503: Alpha Vantage returned %s", error_key)
        raise MarketDataUnavailableError("Market data is temporarily unavailable.")

    return payload


def _request_alpha_vantage_payload(params: dict[str, str]) -> tuple[dict, int | None]:
    is_history_request = params.get("function") == "TIME_SERIES_DAILY"

    if settings.MARKET_API_PROVIDER != "alpha_vantage":
        if is_history_request:
            logger.warning("Returning 503: provider is not alpha_vantage")
        raise MarketDataUnavailableError("provider_not_alpha_vantage")

    if not settings.ALPHA_VANTAGE_API_KEY:
        if is_history_request:
            logger.warning("Returning 503: missing Alpha Vantage API key")
        raise MarketDataNotConfiguredError("Market data service is not configured.")

    if is_history_request:
        logger.info(
            "Calling Alpha Vantage TIME_SERIES_DAILY for symbol=%s timeout=%s",
            params.get("symbol"),
            REQUEST_TIMEOUT_SECONDS,
        )

    try:
        response = requests.get(
            ALPHA_VANTAGE_URL,
            params={**params, "apikey": settings.ALPHA_VANTAGE_API_KEY},
            timeout=REQUEST_TIMEOUT_SECONDS,
        )
        http_status = getattr(response, "status_code", None)
        if is_history_request:
            logger.info("Alpha Vantage HTTP response received: status=%s", http_status)
        response.raise_for_status()
        payload = response.json()
    except requests.RequestException as exc:
        if is_history_request:
            logger.warning(
                "Returning 503: request exception type=%s status=%s",
                exc.__class__.__name__,
                getattr(getattr(exc, "response", None), "status_code", None),
            )
        raise MarketDataUnavailableError("request_exception") from exc
    except ValueError as exc:
        if is_history_request:
            logger.exception(
                "Returning 503: unexpected parser exception type=%s message=%s",
                exc.__class__.__name__,
                exc,
            )
        raise MarketDataUnavailableError("json_parse_exception") from exc

    if is_history_request:
        if isinstance(payload, dict):
            summary = _payload_debug_summary(payload)
            logger.info(
                "Alpha Vantage response: status=%s keys=%s has_time_series=%s has_note=%s has_information=%s has_error=%s",
                http_status,
                summary["top_level_keys"],
                summary["has_time_series_daily"],
                summary["has_note"],
                summary["has_information"],
                summary["has_error_message"],
            )
        else:
            logger.warning("Returning 503: Alpha Vantage payload was not a JSON object")

    return payload, http_status


def _parse_history_points(time_series: Mapping) -> list[InvestmentHistoryPoint]:
    latest_dates = sorted(time_series.keys(), reverse=True)[:30]
    history = []

    for day in reversed(latest_dates):
        daily_data = time_series[day]
        if not isinstance(daily_data, Mapping):
            logger.warning("Skipping non-object history record for date=%s", day)
            continue

        try:
            close_value = daily_data.get("4. close")
            if close_value is None:
                logger.warning("History parse missing field: date=%s field=4. close", day)
            history.append(
                InvestmentHistoryPoint(
                    date=day,
                    close=_required_float(close_value),
                )
            )
        except MarketDataUnavailableError as exc:
            logger.exception(
                "History parse failed: type=%s message=%s date=%s field=4. close value_present=%s",
                exc.__class__.__name__,
                exc,
                day,
                close_value is not None,
            )
            logger.warning("Returning 503: unexpected parser exception")
            raise

    return history


def _log_history_request_start(symbol: str) -> None:
    api_key = settings.ALPHA_VANTAGE_API_KEY or ""
    logger.info(
        "Investment history request: symbol=%s provider=%s api_key_present=%s api_key_length=%s",
        symbol.upper(),
        settings.MARKET_API_PROVIDER,
        bool(api_key),
        len(api_key),
    )


def _base_history_debug_summary(symbol: str) -> dict:
    api_key = settings.ALPHA_VANTAGE_API_KEY or ""
    return {
        "symbol": symbol,
        "provider": settings.MARKET_API_PROVIDER,
        "api_key_present": bool(api_key),
        "api_key_length": len(api_key),
        "http_status": None,
        "top_level_keys": [],
        "has_time_series_daily": False,
        "has_note": False,
        "has_information": False,
        "has_error_message": False,
        "raw_time_series_count": 0,
        "parsed_points_count": 0,
        "debug_reason": "not_started",
    }


def _payload_debug_summary(payload: dict) -> dict:
    return {
        "top_level_keys": list(payload.keys()),
        "has_time_series_daily": TIME_SERIES_DAILY_KEY in payload,
        "has_note": "Note" in payload,
        "has_information": "Information" in payload,
        "has_error_message": "Error Message" in payload,
    }


def _has_alpha_vantage_error(payload: dict) -> bool:
    return _alpha_vantage_error_key(payload) is not None


def _alpha_vantage_error_key(payload: dict) -> str | None:
    for key in ("Note", "Information", "Error Message"):
        if key in payload:
            return key

    return None



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
