from typing import List

import numpy as np
from pypfopt import EfficientFrontier, expected_returns, risk_models

from models.responses import FrontierResponse
from services.alpaca_data import get_prices


def compute_frontier(
    tickers: List[str],
    period_days: int,
    risk_free_rate: float = 0.05,
    n_samples: int = 3000,
) -> FrontierResponse:
    prices = get_prices(tickers, period_days)
    available = [t for t in tickers if t in prices.columns]
    prices = prices[available]
    n = len(available)

    mu = expected_returns.mean_historical_return(prices)
    S = risk_models.CovarianceShrinkage(prices).ledoit_wolf()
    mu_arr = mu.values
    S_arr = S.values

    # --- Monte Carlo random portfolios ---
    rng = np.random.default_rng(42)
    weights_matrix = rng.dirichlet(np.ones(n), size=n_samples)
    random_rets = (weights_matrix @ mu_arr).tolist()
    variances = np.einsum("ij,jk,ik->i", weights_matrix, S_arr, weights_matrix)
    random_vols = np.sqrt(np.clip(variances, 0, None)).tolist()
    random_sharpes = [
        (r - risk_free_rate) / v if v > 1e-9 else 0.0
        for r, v in zip(random_rets, random_vols)
    ]

    # --- Min volatility portfolio ---
    ef_min = EfficientFrontier(mu, S)
    ef_min.min_volatility()
    min_ret, min_vol, _ = ef_min.portfolio_performance(risk_free_rate=risk_free_rate)

    # --- Max Sharpe portfolio ---
    ef_ms = EfficientFrontier(mu, S)
    ef_ms.max_sharpe(risk_free_rate=risk_free_rate)
    ms_ret, ms_vol, ms_sharpe = ef_ms.portfolio_performance(risk_free_rate=risk_free_rate)

    # --- Efficient frontier curve ---
    max_achievable = float(mu.max()) * 0.98
    target_returns = np.linspace(float(min_ret), max_achievable, 60)
    frontier_vols: List[float] = []
    frontier_rets: List[float] = []

    for target in target_returns:
        try:
            ef = EfficientFrontier(mu, S, weight_bounds=(0, 1))
            ef.efficient_return(target_return=float(target))
            r, v, _ = ef.portfolio_performance()
            frontier_vols.append(float(v))
            frontier_rets.append(float(r))
        except Exception:
            pass

    # Sort frontier by vol for a clean line
    paired = sorted(zip(frontier_vols, frontier_rets))
    if paired:
        frontier_vols, frontier_rets = zip(*paired)
        frontier_vols = list(frontier_vols)
        frontier_rets = list(frontier_rets)

    # --- Capital Market Line ---
    # From (0, rf) through (ms_vol, ms_ret), extend to 1.6× ms_vol
    cml_extend_vol = float(ms_vol) * 1.6
    slope = (float(ms_ret) - risk_free_rate) / float(ms_vol) if ms_vol > 1e-9 else 0
    cml_vols = [0.0, cml_extend_vol]
    cml_rets = [risk_free_rate, risk_free_rate + slope * cml_extend_vol]

    return FrontierResponse(
        random_vols=random_vols,
        random_rets=random_rets,
        random_sharpes=random_sharpes,
        frontier_vols=frontier_vols,
        frontier_rets=frontier_rets,
        max_sharpe_vol=float(ms_vol),
        max_sharpe_ret=float(ms_ret),
        max_sharpe_ratio=float(ms_sharpe),
        min_vol=float(min_vol),
        min_ret=float(min_ret),
        cml_vols=cml_vols,
        cml_rets=cml_rets,
        risk_free_rate=risk_free_rate,
    )
