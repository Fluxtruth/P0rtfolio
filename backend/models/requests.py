from pydantic import BaseModel, Field
from typing import Dict, List, Optional
from enum import Enum


class BacktestEngine(str, Enum):
    pandas = "pandas"
    backtesting_py = "backtesting_py"
    zipline = "zipline"
    lean = "lean"


class OptimizationMethod(str, Enum):
    max_sharpe = "max_sharpe"
    min_volatility = "min_volatility"
    efficient_risk = "efficient_risk"
    efficient_return = "efficient_return"


class CorrelationRequest(BaseModel):
    tickers: List[str] = Field(..., min_length=2, max_length=30)
    period_days: int = Field(default=252, ge=60, le=1260)


class OptimizationRequest(BaseModel):
    tickers: List[str] = Field(..., min_length=2, max_length=30)
    period_days: int = Field(default=252, ge=60, le=1260)
    method: OptimizationMethod = OptimizationMethod.max_sharpe
    target_volatility: Optional[float] = Field(default=None, ge=0.01, le=0.99)
    target_return: Optional[float] = Field(default=None, ge=0.01, le=5.0)
    risk_free_rate: float = Field(default=0.05, ge=0.0, le=0.2)


class RebalanceRequest(BaseModel):
    weights: Dict[str, float]
    account_value: float = Field(..., gt=0)
    dry_run: bool = True


class FrontierRequest(BaseModel):
    tickers: List[str] = Field(..., min_length=2, max_length=30)
    period_days: int = Field(default=252, ge=60, le=1260)
    risk_free_rate: float = Field(default=0.05, ge=0.0, le=0.2)
    n_samples: int = Field(default=3000, ge=500, le=8000)
    # Optional: overlay the already-computed optimized portfolio
    optimized_vol: Optional[float] = None
    optimized_ret: Optional[float] = None


class SnapshotRequest(BaseModel):
    target_weights: Dict[str, float] = Field(default_factory=dict)
    drift_threshold: float = Field(default=0.05, ge=0.005, le=0.5)


class BacktestRequest(BaseModel):
    tickers: List[str] = Field(..., min_length=1, max_length=30)
    weights: Dict[str, float]
    period_days: int = Field(default=504, ge=60, le=2520)
    risk_free_rate: float = Field(default=0.05, ge=0.0, le=0.2)
    benchmark: str = Field(default="SPY")
    engine: BacktestEngine = BacktestEngine.pandas
