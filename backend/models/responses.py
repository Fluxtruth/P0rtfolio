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


class BacktestMetrics(BaseModel):
    total_return: float
    cagr: float
    annual_volatility: float
    sharpe_ratio: float
    sortino_ratio: float
    max_drawdown: float
    calmar_ratio: float
    beta: float
    alpha: float
    win_rate: float
    n_trading_days: int


class EquityPoint(BaseModel):
    date: str
    value: float


class BacktestResponse(BaseModel):
    portfolio_equity: List[EquityPoint]
    benchmark_equity: List[EquityPoint]
    drawdown: List[EquityPoint]
    portfolio_metrics: BacktestMetrics
    benchmark_metrics: BacktestMetrics
    benchmark_symbol: Optional[str]
    tickers_used: List[str]
    weights_used: Dict[str, float]


class FrontierResponse(BaseModel):
    # Monte Carlo random portfolios
    random_vols: List[float]
    random_rets: List[float]
    random_sharpes: List[float]
    # Efficient frontier curve points (sorted by vol)
    frontier_vols: List[float]
    frontier_rets: List[float]
    # Key portfolios
    max_sharpe_vol: float
    max_sharpe_ret: float
    max_sharpe_ratio: float
    min_vol: float
    min_ret: float
    # CML endpoints: (0, rf_rate) -> (max_sharpe_vol * 1.5, cml_ret_at_extend)
    cml_vols: List[float]
    cml_rets: List[float]
    risk_free_rate: float
