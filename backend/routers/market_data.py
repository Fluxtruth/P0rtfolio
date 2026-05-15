from fastapi import APIRouter
from models.responses import TickerInfo, TickersResponse
from utils.tickers import SP500_UNIVERSE

router = APIRouter(tags=["market-data"])


@router.get("/tickers", response_model=TickersResponse)
def get_tickers():
    return TickersResponse(tickers=[TickerInfo(**t) for t in SP500_UNIVERSE])
