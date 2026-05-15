"use client";
import { useState } from "react";
import { api } from "@/lib/api";
import type { OptimizationResult } from "@/types";

export function useOptimization() {
  const [result, setResult] = useState<OptimizationResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function optimize(params: {
    tickers: string[];
    periodDays: number;
    method: string;
    targetVolatility?: number;
    targetReturn?: number;
    riskFreeRate: number;
  }) {
    setLoading(true);
    setError(null);
    try {
      const r = await api.optimize({
        tickers: params.tickers,
        period_days: params.periodDays,
        method: params.method,
        target_volatility: params.targetVolatility,
        target_return: params.targetReturn,
        risk_free_rate: params.riskFreeRate,
      });
      setResult(r);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Optimization failed");
    } finally {
      setLoading(false);
    }
  }

  return { result, loading, error, optimize };
}
