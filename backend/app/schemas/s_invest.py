from pydantic import BaseModel


class InvestmentOption(BaseModel):
    symbol: str
    name: str
    asset_type: str


class InvestmentQuoteResponse(BaseModel):
    symbol: str
    name: str
    asset_type: str
    price: float | None
    change: float | None
    change_percent: str | None
    last_updated: str | None
    provider: str


class InvestmentHistoryPoint(BaseModel):
    date: str
    close: float


class InvestmentHistoryResponse(BaseModel):
    symbol: str
    name: str
    asset_type: str
    provider: str
    history: list[InvestmentHistoryPoint]


class InvestmentMarketOverviewResponse(BaseModel):
    options: list[InvestmentOption]
