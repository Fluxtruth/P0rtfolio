"""
Zipline-reloaded backend.

Creates a temporary csvdir bundle from Alpaca price data, ingests it, then
runs a buy-and-hold algorithm using zipline's event-driven engine. This gives
proper order simulation and is the closest to Quantopian's original workflow.
"""
import logging
import os
import tempfile
import uuid
from typing import Dict, List, Tuple

import pandas as pd

# Silence zipline's verbose startup logs
logging.getLogger("zipline").setLevel(logging.ERROR)
logging.getLogger("zipline.data.bundles").setLevel(logging.ERROR)


def run(
    tickers: List[str],
    weights_dict: Dict[str, float],
    prices: pd.DataFrame,
    benchmark: str,
    risk_free_rate: float,
) -> Tuple[pd.Series, pd.Series]:
    from zipline import run_algorithm
    from zipline.api import order_target_percent
    from zipline.api import symbol as zl_symbol
    from zipline.api import set_commission, set_slippage
    from zipline.data.bundles import register
    from zipline.data.bundles.csvdir import csvdir_equities
    from zipline.finance.commission import PerShare
    from zipline.finance.slippage import FixedSlippage

    available = [t for t in tickers if t in prices.columns]
    w = pd.Series({t: weights_dict.get(t, 0.0) for t in available})
    w /= w.sum()
    w_dict = w.to_dict()

    all_syms = list(set(available + ([benchmark] if benchmark in prices.columns else [])))

    with tempfile.TemporaryDirectory() as tmpdir:
        # Write CSVs in zipline csvdir format
        csv_daily = os.path.join(tmpdir, "csv", "daily")
        os.makedirs(csv_daily)
        zl_root = os.path.join(tmpdir, "root")
        os.makedirs(zl_root)

        for sym in all_syms:
            if sym not in prices.columns:
                continue
            s = prices[sym].dropna()
            df = pd.DataFrame({
                "date": s.index.strftime("%Y-%m-%d"),
                "open": s.values,
                "high": s.values,
                "low": s.values,
                "close": s.values,
                "volume": 1_000_000,
                "dividend": 0.0,
                "split": 1.0,
            })
            df.to_csv(os.path.join(csv_daily, f"{sym}.csv"), index=False)

        # Register a uniquely named bundle to avoid global-state collisions
        bundle_name = f"p0rt_{uuid.uuid4().hex[:8]}"
        register(
            bundle_name,
            csvdir_equities(["daily"], os.path.join(tmpdir, "csv")),
            calendar_name="XNYS",
        )

        environ = {"ZIPLINE_ROOT": zl_root}

        # Ingest (writes HDF5 metadata + bcolz arrays)
        from zipline.data.bundles.core import ingest as _ingest
        _ingest(bundle_name, environ=environ, show_progress=False)

        invested = [False]

        def initialize(context):
            set_commission(PerShare(cost=0, min_trade_cost=0))
            set_slippage(FixedSlippage(spread=0))

        def handle_data(context, data):
            if not invested[0]:
                for sym, weight in w_dict.items():
                    try:
                        order_target_percent(zl_symbol(sym), weight)
                    except Exception:
                        pass
                invested[0] = True

        # Run — drop first row (no returns on day 0)
        start = pd.Timestamp(prices.index[1], tz="UTC")
        end = pd.Timestamp(prices.index[-1], tz="UTC")

        result = run_algorithm(
            start=start,
            end=end,
            initialize=initialize,
            handle_data=handle_data,
            capital_base=10_000,
            bundle=bundle_name,
            environ=environ,
        )

    port_returns = result.returns
    port_returns.index = port_returns.index.tz_convert(None).normalize()

    bench_returns = (
        prices[benchmark].pct_change().dropna()
        if benchmark in prices.columns
        else pd.Series(dtype=float)
    )
    return port_returns, bench_returns
