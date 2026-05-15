from fastapi import APIRouter, HTTPException

from models.requests import FrontierRequest
from models.responses import FrontierResponse
from services.frontier import compute_frontier

router = APIRouter(tags=["frontier"])


@router.post("/frontier", response_model=FrontierResponse)
def frontier(req: FrontierRequest):
    try:
        return compute_frontier(
            tickers=req.tickers,
            period_days=req.period_days,
            risk_free_rate=req.risk_free_rate,
            n_samples=req.n_samples,
        )
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Frontier computation failed: {str(e)}")
