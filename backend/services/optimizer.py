from typing import List

from pypfopt import EfficientFrontier, expected_returns, risk_models

from models.requests import OptimizationMethod
from models.responses import OptimizationResponse
from services.alpaca_data import get_prices


def optimize_portfolio(
    tickers: List[str],
    period_days: int,
    method: OptimizationMethod,
    risk_free_rate: float = 0.05,
    target_volatility: float = None,
    target_return: float = None,
) -> OptimizationResponse:
    prices = get_prices(tickers, period_days)
    available = [t for t in tickers if t in prices.columns]
    prices = prices[available]

    mu = expected_returns.mean_historical_return(prices)
    S = risk_models.CovarianceShrinkage(prices).ledoit_wolf()

    ef = EfficientFrontier(mu, S)

    if method == OptimizationMethod.max_sharpe:
        ef.max_sharpe(risk_free_rate=risk_free_rate)
    elif method == OptimizationMethod.min_volatility:
        ef.min_volatility()
    elif method == OptimizationMethod.efficient_risk:
        if target_volatility is None:
            target_volatility = 0.15
        ef.efficient_risk(target_volatility=target_volatility)
    elif method == OptimizationMethod.efficient_return:
        if target_return is None:
            target_return = 0.10
        # Clamp to max achievable return to avoid infeasibility
        max_ret = float(mu.max())
        target_return = min(target_return, max_ret * 0.99)
        ef.efficient_return(target_return=target_return)

    weights = ef.clean_weights(cutoff=0.01)
    ret, vol, sharpe = ef.portfolio_performance(risk_free_rate=risk_free_rate)

    return OptimizationResponse(
        weights={k: round(v, 6) for k, v in weights.items() if v > 0},
        expected_annual_return=round(float(ret), 6),
        annual_volatility=round(float(vol), 6),
        sharpe_ratio=round(float(sharpe), 6),
        method_used=method.value,
    )
