"""Pure pandas/numpy buy-and-hold backend. Zero dependencies beyond the standard stack."""
from typing import Dict, List, Tuple

import pandas as pd


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

    returns = prices[available].pct_change().dropna()
    port_returns = (returns * w).sum(axis=1)

    bench_returns = (
        prices[benchmark].pct_change().dropna()
        if benchmark in prices.columns
        else pd.Series(dtype=float)
    )
    return port_returns, bench_returns
