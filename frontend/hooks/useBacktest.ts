"use client";
import { useState } from "react";
import { api } from "@/lib/api";
import type { BacktestResult } from "@/types";

export function useBacktest() {
  const [result, setResult] = useState<BacktestResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function run(params: {
    tickers: string[];
    weights: Record<string, number>;
    periodDays: number;
    riskFreeRate: number;
    benchmark?: string;
  }) {
    setLoading(true);
    setError(null);
    try {
      const data = await api.runBacktest({
        tickers: params.tickers,
        weights: params.weights,
        period_days: params.periodDays,
        risk_free_rate: params.riskFreeRate,
        benchmark: params.benchmark ?? "SPY",
      });
      setResult(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Backtest failed");
    } finally {
      setLoading(false);
    }
  }

  return { result, loading, error, run };
}
