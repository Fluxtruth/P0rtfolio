from fastapi import APIRouter, HTTPException

from models.requests import OptimizationMethod, OptimizationRequest
from models.responses import OptimizationResponse
from services.optimizer import optimize_portfolio

router = APIRouter(tags=["optimization"])


@router.post("/optimize", response_model=OptimizationResponse)
def optimize(req: OptimizationRequest):
    if req.method == OptimizationMethod.efficient_risk and req.target_volatility is None:
        raise HTTPException(status_code=422, detail="target_volatility required for efficient_risk method")
    if req.method == OptimizationMethod.efficient_return and req.target_return is None:
        raise HTTPException(status_code=422, detail="target_return required for efficient_return method")
    try:
        return optimize_portfolio(
            tickers=req.tickers,
            period_days=req.period_days,
            method=req.method,
            risk_free_rate=req.risk_free_rate,
            target_volatility=req.target_volatility,
            target_return=req.target_return,
        )
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Optimization failed: {str(e)}")
