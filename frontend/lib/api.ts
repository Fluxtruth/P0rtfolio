const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { "Content-Type": "application/json", ...init?.headers },
    ...init,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail ?? "Request failed");
  }
  return res.json() as Promise<T>;
}

export const api = {
  getTickers: () => request<{ tickers: import("@/types").TickerInfo[] }>("/api/tickers"),

  getCorrelation: (body: { tickers: string[]; period_days: number }) =>
    request<import("@/types").CorrelationData>("/api/correlation", {
      method: "POST",
      body: JSON.stringify(body),
    }),

  optimize: (body: {
    tickers: string[];
    period_days: number;
    method: string;
    target_volatility?: number;
    target_return?: number;
    risk_free_rate: number;
  }) =>
    request<import("@/types").OptimizationResult>("/api/optimize", {
      method: "POST",
      body: JSON.stringify(body),
    }),

  getAccount: () => request<import("@/types").AccountData>("/api/account"),

  rebalance: (body: {
    weights: Record<string, number>;
    account_value: number;
    dry_run: boolean;
  }) =>
    request<import("@/types").RebalanceResult>("/api/rebalance", {
      method: "POST",
      body: JSON.stringify(body),
    }),
};
