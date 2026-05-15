"""Shared metric computation and response assembly for all backtest backends."""
from typing import Dict, List, Optional, Tuple

import numpy as np
import pandas as pd

from models.responses import BacktestMetrics, BacktestResponse, EquityPoint


def compute_metrics(
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

    neg = port_returns[port_returns < 0]
    downside_vol = float(neg.std() * np.sqrt(252)) if len(neg) > 1 else 1e-9
    sortino = (cagr - risk_free_rate) / downside_vol if downside_vol > 1e-9 else 0.0

    cumulative = (1 + port_returns).cumprod()
    max_dd = float((cumulative / cumulative.cummax() - 1).min())
    calmar = cagr / abs(max_dd) if max_dd < -1e-9 else 0.0

    aligned = pd.DataFrame({"p": port_returns, "b": bench_returns}).dropna()
    if len(aligned) > 10:
        cov = np.cov(aligned["p"], aligned["b"])
        beta = float(cov[0, 1] / cov[1, 1]) if cov[1, 1] > 1e-12 else 0.0
        bench_cagr = float((1 + aligned["b"]).prod() ** (252 / len(aligned)) - 1)
        alpha = cagr - (risk_free_rate + beta * (bench_cagr - risk_free_rate))
    else:
        beta, alpha = 0.0, 0.0

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
        win_rate=float((port_returns > 0).mean()),
        n_trading_days=n_days,
    )


def _pts(series: pd.Series) -> List[EquityPoint]:
    return [EquityPoint(date=str(d.date()), value=round(float(v), 4)) for d, v in series.items()]


def build_response(
    port_returns: pd.Series,
    bench_returns: pd.Series,
    benchmark_symbol: Optional[str],
    tickers_used: List[str],
    weights_used: Dict[str, float],
    risk_free_rate: float,
    engine_used: str,
) -> BacktestResponse:
    common = port_returns.index.intersection(bench_returns.index)
    pr = port_returns.loc[common]
    br = bench_returns.loc[common]

    port_eq = (1 + pr).cumprod() * 100
    bench_eq = (1 + br).cumprod() * 100
    drawdown = (port_eq / port_eq.cummax() - 1) * 100

    return BacktestResponse(
        portfolio_equity=_pts(port_eq),
        benchmark_equity=_pts(bench_eq),
        drawdown=_pts(drawdown),
        portfolio_metrics=compute_metrics(pr, br, risk_free_rate),
        benchmark_metrics=compute_metrics(br, br, risk_free_rate),
        benchmark_symbol=benchmark_symbol,
        tickers_used=tickers_used,
        weights_used=weights_used,
        engine_used=engine_used,
    )
