from typing import Dict, List

from models.requests import BacktestEngine
from models.responses import BacktestResponse
from services.alpaca_data import get_prices
from services.backends import backtesting_py, lean_backend, pandas_backend, zipline_backend
from services.backends.common import build_response

_ENGINES = {
    BacktestEngine.pandas: pandas_backend.run,
    BacktestEngine.backtesting_py: backtesting_py.run,
    BacktestEngine.zipline: zipline_backend.run,
    BacktestEngine.lean: lean_backend.run,
}


def run_backtest(
    tickers: List[str],
    weights: Dict[str, float],
    period_days: int,
    risk_free_rate: float = 0.05,
    benchmark: str = "SPY",
    engine: BacktestEngine = BacktestEngine.pandas,
) -> BacktestResponse:
    all_symbols = list(set(tickers + [benchmark]))
    prices = get_prices(all_symbols, period_days)

    available = [t for t in tickers if t in prices.columns]
    w = {t: weights.get(t, 0.0) for t in available}
    total = sum(w.values())
    w = {t: v / total for t, v in w.items()} if total > 0 else w

    port_returns, bench_returns = _ENGINES[engine](available, w, prices, benchmark, risk_free_rate)

    return build_response(
        port_returns=port_returns,
        bench_returns=bench_returns,
        benchmark_symbol=benchmark if benchmark in prices.columns else None,
        tickers_used=available,
        weights_used=w,
        risk_free_rate=risk_free_rate,
        engine_used=engine.value,
    )
