from typing import Dict, List, Optional

import numpy as np
import pandas as pd

from models.responses import BacktestResponse, BacktestMetrics, EquityPoint
from services.alpaca_data import get_prices


def _compute_metrics(
    port_returns: pd.Series,
    bench_returns: pd.Series,
    risk_free_rate: float,
) -> BacktestMetrics:
    n_days = len(port_returns)
    n_years = n_days / 252

    total_return = float((1 + port_returns).prod() - 1)
    cagr = float((1 + total_return) ** (1 / n_years) - 1) if n_years > 0 else 0.0
    ann_vol = float(port_returns.std() * np.sqrt(252))
    sharpe = (cagr - risk_free_rate) / ann_vol if ann_vol > 1e-9 else 0.0

    downside = port_returns[port_returns < 0]
    downside_vol = float(downside.std() * np.sqrt(252)) if len(downside) > 1 else 1e-9
    sortino = (cagr - risk_free_rate) / downside_vol if downside_vol > 1e-9 else 0.0

    cumulative = (1 + port_returns).cumprod()
    rolling_max = cumulative.cummax()
    drawdowns = cumulative / rolling_max - 1
    max_dd = float(drawdowns.min())
    calmar = cagr / abs(max_dd) if max_dd < -1e-9 else 0.0

    # Beta / Alpha vs benchmark
    aligned = pd.DataFrame({"p": port_returns, "b": bench_returns}).dropna()
    if len(aligned) > 10:
        cov = np.cov(aligned["p"], aligned["b"])
        beta = float(cov[0, 1] / cov[1, 1]) if cov[1, 1] > 1e-12 else 0.0
        bench_cagr = float((1 + aligned["b"]).prod() ** (252 / len(aligned)) - 1)
        alpha = cagr - (risk_free_rate + beta * (bench_cagr - risk_free_rate))
    else:
        beta, alpha = 0.0, 0.0

    # Win rate
    win_rate = float((port_returns > 0).mean())

    return BacktestMetrics(
        total_return=total_return,
        cagr=cagr,
        annual_volatility=ann_vol,
        sharpe_ratio=sharpe,
        sortino_ratio=sortino,
        max_drawdown=max_dd,
        calmar_ratio=calmar,
        beta=beta,
        alpha=alpha,
        win_rate=win_rate,
        n_trading_days=n_days,
    )


def run_backtest(
    tickers: List[str],
    weights: Dict[str, float],
    period_days: int,
    risk_free_rate: float = 0.05,
    benchmark: str = "SPY",
) -> BacktestResponse:
    all_symbols = list(set(tickers + [benchmark]))
    prices = get_prices(all_symbols, period_days)

    # Align weights to available columns
    available = [t for t in tickers if t in prices.columns]
    w = pd.Series({t: weights.get(t, 0.0) for t in available})
    w = w / w.sum()

    port_prices = prices[available]
    returns = port_prices.pct_change().dropna()
    port_returns = (returns * w).sum(axis=1)

    bench_returns = (
        prices[benchmark].pct_change().dropna()
        if benchmark in prices.columns
        else pd.Series(dtype=float)
    )
    # Align dates
    common_idx = port_returns.index.intersection(bench_returns.index)
    port_returns_aligned = port_returns.loc[common_idx]
    bench_returns_aligned = bench_returns.loc[common_idx]

    # Build equity curves (normalised to 100 at start)
    port_equity = (1 + port_returns_aligned).cumprod() * 100
    bench_equity = (1 + bench_returns_aligned).cumprod() * 100

    # Drawdown series
    roll_max = port_equity.cummax()
    drawdown_series = (port_equity / roll_max - 1) * 100  # as percentage

    def to_points(series: pd.Series) -> List[EquityPoint]:
        return [
            EquityPoint(date=str(d.date()), value=round(float(v), 4))
            for d, v in series.items()
        ]

    port_metrics = _compute_metrics(port_returns_aligned, bench_returns_aligned, risk_free_rate)
    bench_metrics = _compute_metrics(bench_returns_aligned, bench_returns_aligned, risk_free_rate)

    return BacktestResponse(
        portfolio_equity=to_points(port_equity),
        benchmark_equity=to_points(bench_equity),
        drawdown=to_points(drawdown_series),
        portfolio_metrics=port_metrics,
        benchmark_metrics=bench_metrics,
        benchmark_symbol=benchmark if benchmark in prices.columns else None,
        tickers_used=available,
        weights_used={t: float(w[t]) for t in available},
    )
