import time
from datetime import datetime, timedelta
from functools import lru_cache
from typing import Dict, FrozenSet, List, Tuple

import pandas as pd
from alpaca.data.historical import StockHistoricalDataClient
from alpaca.data.requests import StockBarsRequest, StockLatestQuoteRequest
from alpaca.data.timeframe import TimeFrame

from config import settings

_cache: Dict[Tuple, Tuple[pd.DataFrame, float]] = {}


def _get_client() -> StockHistoricalDataClient:
    return StockHistoricalDataClient(
        api_key=settings.alpaca_api_key or None,
        secret_key=settings.alpaca_secret_key or None,
    )


def get_prices(tickers: List[str], period_days: int) -> pd.DataFrame:
    """Return a (date x ticker) DataFrame of split-adjusted close prices."""
    cache_key = (frozenset(tickers), period_days)
    now = time.time()

    if cache_key in _cache:
        df, ts = _cache[cache_key]
        if now - ts < settings.price_data_cache_ttl:
            return df

    client = _get_client()
    end = datetime.now()
    # Fetch extra days to account for weekends/holidays
    start = end - timedelta(days=int(period_days * 1.5))

    request = StockBarsRequest(
        symbol_or_symbols=tickers,
        timeframe=TimeFrame.Day,
        start=start,
        end=end,
        adjustment="split",
    )
    bars = client.get_stock_bars(request).df

    if bars.empty:
        raise ValueError(f"No price data returned for tickers: {tickers}")

    # Multi-index: (symbol, timestamp) -> pivot to (timestamp x symbol)
    bars = bars.reset_index()
    prices = bars.pivot_table(index="timestamp", columns="symbol", values="close")
    prices.index = pd.to_datetime(prices.index).tz_localize(None).normalize()

    # Keep only the most recent period_days trading days
    prices = prices.sort_index().iloc[-period_days:]

    # Drop columns (tickers) with too many NaN
    prices = prices.dropna(axis=1, thresh=int(period_days * 0.8))

    _cache[cache_key] = (prices, now)
    return prices


def get_latest_prices(tickers: List[str]) -> Dict[str, float]:
    """Return latest ask price for each ticker."""
    client = _get_client()
    request = StockLatestQuoteRequest(symbol_or_symbols=tickers)
    quotes = client.get_stock_latest_quote(request)
    return {
        symbol: float(quote.ask_price or quote.bid_price or 0)
        for symbol, quote in quotes.items()
    }
