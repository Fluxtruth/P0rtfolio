from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from config import settings
from routers import correlation, market_data, optimization, trading

app = FastAPI(
    title="Portfolio Optimizer API",
    description="Ray Dalio-inspired portfolio optimization with Alpaca paper trading",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(market_data.router, prefix="/api")
app.include_router(correlation.router, prefix="/api")
app.include_router(optimization.router, prefix="/api")
app.include_router(trading.router, prefix="/api")


@app.get("/health")
def health():
    return {"status": "ok"}
