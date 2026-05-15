from pydantic import BaseModel, Field
from typing import Dict, List, Optional
from enum import Enum


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
