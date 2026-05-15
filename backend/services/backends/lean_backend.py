"""
LEAN (QuantConnect) backend via Docker.

Generates a buy-and-hold QCAlgorithm, writes Alpaca prices as LEAN-format
daily equity CSVs, and runs the quantconnect/lean Docker image. Results are
parsed from Statistics.json in the output folder.

Requirements: Docker daemon must be running and `quantconnect/lean` image
must be available (docker pull quantconnect/lean).
"""
import io
import json
import logging
import os
import subprocess
import tempfile
import zipfile
from typing import Dict, List, Tuple

import pandas as pd

log = logging.getLogger(__name__)

_ALGORITHM_TEMPLATE = '''\
from AlgorithmImports import *

class BuyAndHoldAlgorithm(QCAlgorithm):
    def Initialize(self):
        self.SetStartDate({start_year}, {start_month}, {start_day})
        self.SetEndDate({end_year}, {end_month}, {end_day})
        self.SetCash(100000)
        self.weights = {weights_repr}
        for ticker in self.weights:
            self.AddEquity(ticker, Resolution.Daily)

    def OnData(self, data):
        if not self.Portfolio.Invested:
            for ticker, weight in self.weights.items():
                self.SetHoldings(ticker, weight)
'''

_CONFIG_TEMPLATE = {
    "algorithm-type-name": "BuyAndHoldAlgorithm",
    "algorithm-language": "Python",
    "algorithm-location": "/Lean/Launcher/bin/Debug/main.py",
    "data-folder": "/data",
    "debugging": False,
    "log-handler": "CompositeLogHandler",
    "messaging-handler": "Messaging.Messaging",
    "job-user-id": "0",
    "api-access-token": "",
    "live-mode": False,
    "results-destination-folder": "/results",
}


def _write_lean_csv_zip(sym: str, prices: pd.Series, out_dir: str) -> None:
    """Write a LEAN-format daily equity zip: equity/usa/daily/<sym>.zip."""
    path = os.path.join(out_dir, "equity", "usa", "daily")
    os.makedirs(path, exist_ok=True)
    zip_path = os.path.join(path, f"{sym.lower()}.zip")
    rows = []
    for dt, price in prices.dropna().items():
        # LEAN daily format: "yyyyMMdd HH:mm,open*10000,high*10000,low*10000,close*10000,volume"
        scaled = int(round(float(price) * 10_000))
        rows.append(f"{dt.strftime('%Y%m%d')} 00:00,{scaled},{scaled},{scaled},{scaled},0")
    csv_content = "\n".join(rows).encode()
    with zipfile.ZipFile(zip_path, "w", zipfile.ZIP_DEFLATED) as zf:
        zf.writestr(f"{sym.lower()}.csv", csv_content)


def run(
    tickers: List[str],
    weights_dict: Dict[str, float],
    prices: pd.DataFrame,
    benchmark: str,
    risk_free_rate: float,
) -> Tuple[pd.Series, pd.Series]:
    # Check Docker daemon
    try:
        result = subprocess.run(
            ["docker", "info"], capture_output=True, timeout=5
        )
        if result.returncode != 0:
            raise RuntimeError("Docker daemon is not running.")
    except FileNotFoundError:
        raise RuntimeError("Docker is not installed.")
    except subprocess.TimeoutExpired:
        raise RuntimeError("Docker daemon timed out.")

    # Check image exists
    check = subprocess.run(
        ["docker", "images", "-q", "quantconnect/lean"],
        capture_output=True, text=True, timeout=10
    )
    if not check.stdout.strip():
        raise RuntimeError(
            "LEAN image not found locally. Run: docker pull quantconnect/lean"
        )

    available = [t for t in tickers if t in prices.columns]
    w = pd.Series({t: weights_dict.get(t, 0.0) for t in available})
    w /= w.sum()
    w_dict = w.to_dict()

    start_dt = prices.index[0]
    end_dt = prices.index[-1]

    with tempfile.TemporaryDirectory() as tmpdir:
        data_dir = os.path.join(tmpdir, "data")
        results_dir = os.path.join(tmpdir, "results")
        os.makedirs(data_dir)
        os.makedirs(results_dir)

        # Write price data in LEAN format
        for sym in available:
            _write_lean_csv_zip(sym, prices[sym], data_dir)

        # Generate algorithm
        algorithm_src = _ALGORITHM_TEMPLATE.format(
            start_year=start_dt.year, start_month=start_dt.month, start_day=start_dt.day,
            end_year=end_dt.year, end_month=end_dt.month, end_day=end_dt.day,
            weights_repr=repr(w_dict),
        )
        main_py = os.path.join(tmpdir, "main.py")
        config_json = os.path.join(tmpdir, "config.json")
        with open(main_py, "w") as f:
            f.write(algorithm_src)
        with open(config_json, "w") as f:
            json.dump(_CONFIG_TEMPLATE, f)

        cmd = [
            "docker", "run", "--rm",
            "-v", f"{data_dir}:/data",
            "-v", f"{results_dir}:/results",
            "-v", f"{main_py}:/Lean/Launcher/bin/Debug/main.py",
            "-v", f"{config_json}:/Lean/Launcher/bin/Debug/config.json",
            "quantconnect/lean:latest",
        ]
        proc = subprocess.run(cmd, capture_output=True, text=True, timeout=300)
        if proc.returncode != 0:
            raise RuntimeError(f"LEAN Docker run failed:\n{proc.stderr[-2000:]}")

        # Parse equity CSV from results
        equity_files = [
            f for f in os.listdir(results_dir)
            if f.endswith("-equity.csv") or f == "equity.csv"
        ]
        if not equity_files:
            raise RuntimeError("LEAN produced no equity output. Check algorithm logs.")

        equity_df = pd.read_csv(os.path.join(results_dir, equity_files[0]))
        equity_df["date"] = pd.to_datetime(equity_df.iloc[:, 0])
        equity_df = equity_df.set_index("date").sort_index()
        port_values = equity_df.iloc[:, 1].astype(float)
        port_returns = port_values.pct_change().dropna()

    bench_returns = (
        prices[benchmark].pct_change().dropna()
        if benchmark in prices.columns
        else pd.Series(dtype=float)
    )
    return port_returns, bench_returns
