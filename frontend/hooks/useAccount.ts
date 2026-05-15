"use client";
import { useEffect, useState, useCallback } from "react";
import { api } from "@/lib/api";
import type { AccountData } from "@/types";

export function useAccount() {
  const [data, setData] = useState<AccountData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await api.getAccount();
      setData(result);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load account");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { data, loading, error, refresh };
}
