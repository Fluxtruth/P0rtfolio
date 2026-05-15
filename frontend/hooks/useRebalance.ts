"use client";
import { useState } from "react";
import { api } from "@/lib/api";
import type { RebalanceResult } from "@/types";

export function useRebalance() {
  const [result, setResult] = useState<RebalanceResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function execute(params: {
    weights: Record<string, number>;
    accountValue: number;
    dryRun: boolean;
  }) {
    setLoading(true);
    setError(null);
    try {
      const r = await api.rebalance({
        weights: params.weights,
        account_value: params.accountValue,
        dry_run: params.dryRun,
      });
      setResult(r);
      return r;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Rebalance failed");
      return null;
    } finally {
      setLoading(false);
    }
  }

  function reset() {
    setResult(null);
    setError(null);
  }

  return { result, loading, error, execute, reset };
}
