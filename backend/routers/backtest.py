from fastapi import APIRouter, HTTPException

from models.requests import BacktestRequest
from models.responses import BacktestResponse
from services.backtest import run_backtest

router = APIRouter(tags=["backtest"])


@router.post("/backtest", response_model=BacktestResponse)
def backtest(req: BacktestRequest):
    try:
        return run_backtest(
            tickers=req.tickers,
            weights=req.weights,
            period_days=req.period_days,
            risk_free_rate=req.risk_free_rate,
            benchmark=req.benchmark,
            engine=req.engine,
        )
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Backtest failed: {str(e)}")
