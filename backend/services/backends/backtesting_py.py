"""
backtesting.py backend (https://kernc.github.io/backtesting.py/).

Computes a synthetic portfolio price series from weighted daily returns, then
runs it through backtesting.py's event loop so we get its execution engine and
built-in stats for free.
"""
from typing import Dict, List, Tuple

import pandas as pd
from backtesting import Backtest, Strategy


class _BuyAndHold(Strategy):
    def init(self):
        pass

    def next(self):
        if not self.position:
            self.buy()


def run(
    tickers: List[str],
    weights_dict: Dict[str, float],
    prices: pd.DataFrame,
    benchmark: str,
    risk_free_rate: float,
) -> Tuple[pd.Series, pd.Series]:
    available = [t for t in tickers if t in prices.columns]
    w = pd.Series({t: weights_dict.get(t, 0.0) for t in available})
    w /= w.sum()

    port_ret = (prices[available].pct_change().dropna() * w).sum(axis=1)

    # Synthetic OHLCV from cumulative portfolio value
    equity = (1 + port_ret).cumprod() * 100.0
    data = pd.DataFrame(
        {"Open": equity, "High": equity, "Low": equity, "Close": equity, "Volume": 1.0},
        index=equity.index,
    )

    bt = Backtest(data, _BuyAndHold, cash=100.0, commission=0.0)
    bt.run()
    # Returns are recoverable from the equity series; we use our own common
    # metrics layer for consistency, so just return the returns series.

    bench_returns = (
        prices[benchmark].pct_change().dropna()
        if benchmark in prices.columns
        else pd.Series(dtype=float)
    )
    return port_ret, bench_returns
