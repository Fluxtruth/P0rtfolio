from datetime import datetime
from typing import Dict

from models.responses import AccountInfo, EnrichedPosition, SnapshotResponse
from services.alpaca_trading import get_account


def get_snapshot(target_weights: Dict[str, float], drift_threshold: float) -> SnapshotResponse:
    account_data = get_account()
    total_value = float(account_data.account.portfolio_value)
    cash = float(account_data.account.cash)
    cash_weight = cash / total_value if total_value > 0 else 0.0

    # Normalise target weights so they sum to 1
    tw_sum = sum(target_weights.values())
    norm_targets = {k: v / tw_sum for k, v in target_weights.items()} if tw_sum > 0 else target_weights

    enriched = []
    position_symbols = set()

    for pos in account_data.positions:
        sym = pos.symbol
        position_symbols.add(sym)
        mv = float(pos.market_value)
        current_w = mv / total_value if total_value > 0 else 0.0
        target_w = norm_targets.get(sym, 0.0)
        drift = current_w - target_w
        enriched.append(EnrichedPosition(
            symbol=sym,
            qty=pos.qty,
            market_value=pos.market_value,
            unrealized_pl=pos.unrealized_pl,
            current_price=pos.current_price,
            unrealized_plpc=pos.unrealized_plpc,
            current_weight=round(current_w, 6),
            target_weight=round(target_w, 6),
            drift=round(drift, 6),
            needs_rebalance=abs(drift) > drift_threshold,
        ))

    # Sort by abs drift descending
    enriched.sort(key=lambda p: abs(p.drift), reverse=True)

    # Tickers in account not in targets
    untracked = [s for s in position_symbols if s not in norm_targets]

    # Target tickers with no current position
    missing = [s for s in norm_targets if s not in position_symbols]

    # Total drift = sum of abs drift across ALL target tickers (including missing)
    held_drift = sum(abs(p.drift) for p in enriched if p.symbol in norm_targets)
    missing_drift = sum(norm_targets.get(s, 0.0) for s in missing)
    total_drift = held_drift + missing_drift

    return SnapshotResponse(
        account=account_data.account,
        positions=enriched,
        cash_weight=round(cash_weight, 6),
        untracked=untracked,
        missing=missing,
        total_drift=round(total_drift, 6),
        needs_rebalance=total_drift > drift_threshold,
        drift_threshold=drift_threshold,
        updated_at=datetime.utcnow().isoformat() + "Z",
    )
