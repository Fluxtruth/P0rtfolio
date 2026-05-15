import math
from typing import Dict, List

from alpaca.trading.client import TradingClient
from alpaca.trading.enums import OrderSide, TimeInForce
from alpaca.trading.requests import MarketOrderRequest

from config import settings
from models.responses import AccountInfo, AccountResponse, OrderPreview, Position, RebalanceResponse
from services.alpaca_data import get_latest_prices


def _get_client() -> TradingClient:
    return TradingClient(
        api_key=settings.alpaca_api_key,
        secret_key=settings.alpaca_secret_key,
        paper=settings.alpaca_paper,
    )


def get_account() -> AccountResponse:
    client = _get_client()
    account = client.get_account()
    raw_positions = client.get_all_positions()

    positions = [
        Position(
            symbol=p.symbol,
            qty=str(p.qty),
            market_value=str(p.market_value),
            unrealized_pl=str(p.unrealized_pl),
            current_price=str(p.current_price),
            unrealized_plpc=str(round(float(p.unrealized_plpc or 0) * 100, 2)),
        )
        for p in raw_positions
    ]

    return AccountResponse(
        account=AccountInfo(
            portfolio_value=str(account.portfolio_value),
            cash=str(account.cash),
            buying_power=str(account.buying_power),
            equity=str(account.equity),
        ),
        positions=positions,
    )


def compute_rebalance(
    weights: Dict[str, float],
    account_value: float,
    dry_run: bool = True,
) -> RebalanceResponse:
    client = _get_client()
    tickers = list(weights.keys())

    # Get current positions
    raw_positions = client.get_all_positions()
    current_qty: Dict[str, int] = {p.symbol: int(float(p.qty)) for p in raw_positions}

    # Get latest prices
    latest_prices = get_latest_prices(tickers)

    orders_placed: List[OrderPreview] = []
    orders_skipped: List[str] = []
    MIN_TRADE_VALUE = 10.0

    for symbol, weight in weights.items():
        price = latest_prices.get(symbol, 0)
        if price <= 0:
            orders_skipped.append(f"{symbol} (no price)")
            continue

        target_value = weight * account_value
        target_qty = math.floor(target_value / price)
        current = current_qty.get(symbol, 0)
        delta = target_qty - current

        if delta == 0:
            orders_skipped.append(f"{symbol} (no change)")
            continue

        delta_value = abs(delta) * price
        if delta_value < MIN_TRADE_VALUE:
            orders_skipped.append(f"{symbol} (< ${MIN_TRADE_VALUE:.0f})")
            continue

        side = OrderSide.BUY if delta > 0 else OrderSide.SELL

        if not dry_run:
            client.submit_order(
                MarketOrderRequest(
                    symbol=symbol,
                    qty=abs(delta),
                    side=side,
                    time_in_force=TimeInForce.DAY,
                )
            )

        orders_placed.append(
            OrderPreview(
                symbol=symbol,
                side=side.value,
                qty=abs(delta),
                estimated_value=round(delta_value, 2),
                current_price=round(price, 2),
            )
        )

    return RebalanceResponse(
        orders_placed=orders_placed,
        orders_skipped=orders_skipped,
        total_trades=len(orders_placed),
        dry_run=dry_run,
    )
