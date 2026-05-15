"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import { api } from "@/lib/api";
import type { SnapshotResult } from "@/types";

const REFRESH_OPTIONS = [
  { label: "10 s", ms: 10_000 },
  { label: "30 s", ms: 30_000 },
  { label: "60 s", ms: 60_000 },
  { label: "Manual", ms: 0 },
];

export { REFRESH_OPTIONS };

export function useSnapshot(targetWeights: Record<string, number>, driftThreshold: number) {
  const [data, setData] = useState<SnapshotResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [refreshMs, setRefreshMs] = useState(30_000);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetch = useCallback(async () => {
    if (Object.keys(targetWeights).length === 0) return;
    setLoading(true);
    setError(null);
    try {
      const result = await api.getSnapshot({
        target_weights: targetWeights,
        drift_threshold: driftThreshold,
      });
      setData(result);
      setLastUpdated(new Date());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to fetch portfolio snapshot");
    } finally {
      setLoading(false);
    }
  }, [targetWeights, driftThreshold]);

  // Initial fetch
  useEffect(() => { fetch(); }, [fetch]);

  // Auto-refresh
  useEffect(() => {
    if (!refreshMs) return;
    const id = setInterval(fetch, refreshMs);
    return () => clearInterval(id);
  }, [fetch, refreshMs]);

  return { data, loading, error, lastUpdated, refresh: fetch, refreshMs, setRefreshMs, REFRESH_OPTIONS };
}
