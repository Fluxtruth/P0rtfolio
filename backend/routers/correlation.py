from fastapi import APIRouter, HTTPException

from models.requests import CorrelationRequest
from models.responses import CorrelationResponse
from services.correlation import compute_correlation

router = APIRouter(tags=["correlation"])


@router.post("/correlation", response_model=CorrelationResponse)
def correlation(req: CorrelationRequest):
    try:
        return compute_correlation(req.tickers, req.period_days)
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Correlation failed: {str(e)}")
