from collections.abc import Mapping
from datetime import date, timedelta
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
FALLBACK_HISTORY_PROVIDER = "fallback_demo"

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

_FALLBACK_CLOSE_SERIES = {
    "AAPL": [
        188.42, 189.15, 190.08, 189.73, 191.24, 192.68, 193.11, 192.55, 194.02, 195.36,
        196.18, 195.74, 197.29, 198.11, 197.66, 199.04, 200.38, 199.85, 201.22, 202.16,
        201.71, 203.08, 204.32, 203.77, 205.14, 206.01, 205.46, 207.19, 208.04, 207.62,
    ],
    "MSFT": [
        421.35, 423.28, 425.64, 424.92, 428.17, 430.06, 432.51, 431.74, 434.39, 436.82,
        438.14, 437.66, 440.28, 442.91, 444.35, 443.72, 446.18, 448.56, 447.89, 450.21,
        452.44, 451.87, 454.62, 456.03, 457.78, 456.94, 459.31, 461.05, 460.48, 462.26,
    ],
    "GOOGL": [
        164.72, 165.34, 166.19, 165.91, 167.28, 168.04, 168.73, 168.36, 169.52, 170.41,
        171.08, 170.76, 172.15, 173.02, 173.64, 173.21, 174.39, 175.18, 174.86, 176.27,
        177.05, 177.62, 177.24, 178.51, 179.33, 180.07, 179.68, 181.14, 182.02, 181.57,
    ],
    "AMZN": [
        178.25, 179.04, 180.37, 179.82, 181.46, 182.13, 183.58, 183.02, 184.74, 185.21,
        186.62, 186.09, 187.48, 188.36, 189.12, 188.57, 190.04, 191.39, 190.83, 192.45,
        193.18, 194.02, 193.56, 195.11, 196.34, 195.87, 197.28, 198.06, 199.31, 198.74,
    ],
    "TSLA": [
        171.36, 174.82, 178.45, 176.11, 181.92, 185.38, 183.74, 189.56, 193.21, 190.84,
        196.47, 201.33, 198.75, 204.62, 209.18, 206.44, 213.59, 218.36, 215.07, 222.81,
        228.14, 224.63, 231.48, 237.92, 233.56, 240.17, 246.35, 242.04, 249.71, 245.88,
    ],
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
    _log_history_request_start(option.symbol)

    try:
        payload, _http_status = _request_alpha_vantage_payload(
            {
                "function": "TIME_SERIES_DAILY",
                "symbol": option.symbol,
                "outputsize": "compact",
            }
        )
    except MarketDataNotConfiguredError:
        logger.warning("Using fallback_demo history: missing Alpha Vantage API key")
        return _fallback_history_response(option, "missing_api_key")
    except MarketDataUnavailableError as exc:
        logger.warning("Using fallback_demo history: %s", str(exc) or "market_data_unavailable")
        return _fallback_history_response(option, str(exc) or "market_data_unavailable")

    if not isinstance(payload, dict):
        logger.warning("Using fallback_demo history: Alpha Vantage payload was not a JSON object")
        return _fallback_history_response(option, "payload_not_object")

    error_key = _alpha_vantage_error_key(payload)
    if error_key:
        logger.warning("Using fallback_demo history: Alpha Vantage returned %s", error_key)
        return _fallback_history_response(option, f"alpha_vantage_{error_key.lower().replace(' ', '_')}")

    time_series = payload.get(TIME_SERIES_DAILY_KEY)
    if not isinstance(time_series, Mapping):
        logger.warning("Using fallback_demo history: Time Series (Daily) missing")
        return _fallback_history_response(option, "time_series_daily_missing")

    logger.info(
        "Alpha Vantage daily records: count=%s first_dates=%s",
        len(time_series),
        list(time_series.keys())[:3],
    )
    try:
        history = _parse_history_points(time_series)
    except MarketDataUnavailableError:
        logger.warning("Using fallback_demo history: parser exception")
        return _fallback_history_response(option, "parser_exception")

    logger.info(
        "Parsed investment history: points=%s first_point=%s last_point=%s",
        len(history),
        history[0].model_dump() if history else None,
        history[-1].model_dump() if history else None,
    )

    if not history:
        logger.warning("Using fallback_demo history: parsed history is empty")
        return _fallback_history_response(option, "parsed_history_empty")

    return InvestmentHistoryResponse(
        symbol=option.symbol,
        name=option.name,
        asset_type=option.asset_type,
        provider=settings.MARKET_API_PROVIDER,
        history=history,
    )


def _fallback_history_response(option: InvestmentOption, reason: str) -> InvestmentHistoryResponse:
    closes = _FALLBACK_CLOSE_SERIES[option.symbol]
    start_date = date.today() - timedelta(days=len(closes) - 1)
    history = [
        InvestmentHistoryPoint(
            date=(start_date + timedelta(days=index)).isoformat(),
            close=close,
        )
        for index, close in enumerate(closes)
    ]

    logger.info(
        "Fallback demo history generated: symbol=%s reason=%s points=%s first_point=%s last_point=%s",
        option.symbol,
        reason,
        len(history),
        history[0].model_dump(),
        history[-1].model_dump(),
    )

    return InvestmentHistoryResponse(
        symbol=option.symbol,
        name=option.name,
        asset_type=option.asset_type,
        provider=FALLBACK_HISTORY_PROVIDER,
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
        logger.warning("Debug history summary: missing Alpha Vantage API key")
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
            logger.warning("Alpha Vantage history unavailable: provider is not alpha_vantage")
        raise MarketDataUnavailableError("provider_not_alpha_vantage")

    if not settings.ALPHA_VANTAGE_API_KEY:
        if is_history_request:
            logger.warning("Alpha Vantage history unavailable: missing Alpha Vantage API key")
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
                "Alpha Vantage history request exception: type=%s status=%s",
                exc.__class__.__name__,
                getattr(getattr(exc, "response", None), "status_code", None),
            )
        raise MarketDataUnavailableError("request_exception") from exc
    except ValueError as exc:
        if is_history_request:
            logger.warning(
                "Alpha Vantage history JSON parse exception: type=%s message=%s",
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
            logger.warning("Alpha Vantage history unavailable: payload was not a JSON object")

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
            logger.warning(
                "History parse failed: type=%s message=%s date=%s field=4. close value_present=%s",
                exc.__class__.__name__,
                exc,
                day,
                close_value is not None,
            )
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
