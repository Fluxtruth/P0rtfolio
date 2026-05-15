"use client";
import { useState } from "react";
import { api } from "@/lib/api";
import type { FrontierData } from "@/types";

export function useFrontier() {
  const [data, setData] = useState<FrontierData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function compute(params: {
    tickers: string[];
    periodDays: number;
    riskFreeRate: number;
    optimizedVol?: number;
    optimizedRet?: number;
  }) {
    setLoading(true);
    setError(null);
    try {
      const result = await api.getFrontier({
        tickers: params.tickers,
        period_days: params.periodDays,
        risk_free_rate: params.riskFreeRate,
        n_samples: 3000,
        optimized_vol: params.optimizedVol,
        optimized_ret: params.optimizedRet,
      });
      setData(result);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Frontier computation failed");
    } finally {
      setLoading(false);
    }
  }

  return { data, loading, error, compute };
}
