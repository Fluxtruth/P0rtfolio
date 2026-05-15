from fastapi import APIRouter, HTTPException

from models.requests import RebalanceRequest
from models.responses import AccountResponse, RebalanceResponse
from services.alpaca_trading import compute_rebalance, get_account

router = APIRouter(tags=["trading"])


@router.get("/account", response_model=AccountResponse)
def account():
    try:
        return get_account()
    except Exception as e:
        raise HTTPException(status_code=503, detail=f"Alpaca account unavailable: {str(e)}")


@router.post("/rebalance", response_model=RebalanceResponse)
def rebalance(req: RebalanceRequest):
    try:
        return compute_rebalance(
            weights=req.weights,
            account_value=req.account_value,
            dry_run=req.dry_run,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Rebalance failed: {str(e)}")
