from pydantic import BaseModel
from typing import Dict, List, Optional, Any


class TickerInfo(BaseModel):
    symbol: str
    name: str
    sector: str


class TickersResponse(BaseModel):
    tickers: List[TickerInfo]


class DendrogramData(BaseModel):
    icoord: List[List[float]]
    dcoord: List[List[float]]
    ivl: List[str]


class CorrelationResponse(BaseModel):
    tickers_ordered: List[str]
    correlation_matrix: List[List[float]]
    dendrogram_row: DendrogramData
    dendrogram_col: DendrogramData


class OptimizationResponse(BaseModel):
    weights: Dict[str, float]
    expected_annual_return: float
    annual_volatility: float
    sharpe_ratio: float
    method_used: str


class Position(BaseModel):
    symbol: str
    qty: str
    market_value: str
    unrealized_pl: str
    current_price: str
    unrealized_plpc: str


class AccountInfo(BaseModel):
    portfolio_value: str
    cash: str
    buying_power: str
    equity: str


class AccountResponse(BaseModel):
    account: AccountInfo
    positions: List[Position]


class OrderPreview(BaseModel):
    symbol: str
    side: str
    qty: int
    estimated_value: float
    current_price: float


class RebalanceResponse(BaseModel):
    orders_placed: List[OrderPreview]
    orders_skipped: List[str]
    total_trades: int
    dry_run: bool
