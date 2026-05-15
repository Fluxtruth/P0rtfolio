"use client";
import { useState } from "react";
import { api } from "@/lib/api";
import type { CorrelationData } from "@/types";

export function useCorrelation() {
  const [data, setData] = useState<CorrelationData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function compute(tickers: string[], periodDays: number) {
    setLoading(true);
    setError(null);
    try {
      const result = await api.getCorrelation({ tickers, period_days: periodDays });
      setData(result);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to compute correlation");
    } finally {
      setLoading(false);
    }
  }

  return { data, loading, error, compute };
}
