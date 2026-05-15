"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import { ErrorAlert } from "@/components/ui/ErrorAlert";
import { DriftChart } from "@/components/DriftChart";
import { PositionsTable } from "@/components/PositionsTable";
import { useSnapshot, REFRESH_OPTIONS } from "@/hooks/useSnapshot";
import { fmtDollar, fmtPct } from "@/lib/formatters";
import {
  ChartBarIcon,
  ArrowPathIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  Cog6ToothIcon,
} from "@heroicons/react/24/outline";

const STORAGE_KEY = "portfolio_target_weights";

function StatCard({ label, value, sub, color = "text-zinc-100" }: {
  label: string; value: string; sub?: string; color?: string;
}) {
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 px-5 py-4">
      <p className="text-xs text-zinc-500 mb-1">{label}</p>
      <p className={`text-2xl font-bold tabular-nums ${color}`}>{value}</p>
      {sub && <p className="text-xs text-zinc-600 mt-0.5">{sub}</p>}
    </div>
  );
}

function timeAgo(date: Date): string {
  const s = Math.round((Date.now() - date.getTime()) / 1000);
  if (s < 5) return "just now";
  if (s < 60) return `${s}s ago`;
  return `${Math.floor(s / 60)}m ago`;
}

export default function DashboardPage() {
  const [targetWeights, setTargetWeights] = useState<Record<string, number>>({});
  const [driftThreshold, setDriftThreshold] = useState(0.05);
  const [hasWeights, setHasWeights] = useState(false);
  const [tick, setTick] = useState(0); // forces timeAgo re-render

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      setTargetWeights(parsed);
      setHasWeights(true);
    }
  }, []);

  // Re-render timeAgo every 5s
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 5_000);
    return () => clearInterval(id);
  }, []);

  const { data, loading, error, lastUpdated, refresh, refreshMs, setRefreshMs } =
    useSnapshot(targetWeights, driftThreshold);

  const totalPL = data
    ? data.positions.reduce((s, p) => s + parseFloat(p.unrealized_pl), 0)
    : 0;

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-zinc-800 bg-zinc-950/80 backdrop-blur-md">
        <div className="mx-auto max-w-7xl px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600">
              <ChartBarIcon className="h-5 w-5 text-white" />
            </div>
            <nav className="flex gap-1">
              <Link
                href="/optimizer"
                className="rounded-md px-3 py-1.5 text-sm text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-colors"
              >
                Optimizer
              </Link>
              <span className="rounded-md px-3 py-1.5 text-sm font-medium text-zinc-100 bg-zinc-800">
                Dashboard
              </span>
            </nav>
          </div>

          <div className="flex items-center gap-3">
            {/* Drift threshold */}
            <div className="flex items-center gap-2">
              <Cog6ToothIcon className="h-4 w-4 text-zinc-500" />
              <label className="text-xs text-zinc-500">Alert threshold</label>
              <select
                value={driftThreshold}
                onChange={(e) => setDriftThreshold(Number(e.target.value))}
                className="rounded border border-zinc-700 bg-zinc-900 px-2 py-1 text-xs text-zinc-100"
              >
                <option value={0.02}>2%</option>
                <option value={0.05}>5%</option>
                <option value={0.10}>10%</option>
              </select>
            </div>

            {/* Refresh interval */}
            <select
              value={refreshMs}
              onChange={(e) => setRefreshMs(Number(e.target.value))}
              className="rounded border border-zinc-700 bg-zinc-900 px-2 py-1 text-xs text-zinc-100"
            >
              {REFRESH_OPTIONS.map((o) => (
                <option key={o.ms} value={o.ms}>{o.label}</option>
              ))}
            </select>

            <Button onClick={refresh} disabled={loading} variant="secondary" className="flex items-center gap-1.5 text-xs px-3 py-1.5">
              {loading ? <Spinner className="h-3.5 w-3.5" /> : <ArrowPathIcon className={`h-3.5 w-3.5 ${loading ? "" : "group-hover:rotate-180 transition-transform"}`} />}
              Refresh
            </Button>

            {lastUpdated && (
              <span className="text-xs text-zinc-600 tabular-nums" suppressHydrationWarning>
                {timeAgo(lastUpdated)}
              </span>
            )}

            {/* Live pulse */}
            {refreshMs > 0 && (
              <span className="flex items-center gap-1.5 text-xs text-emerald-400">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Live
              </span>
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 space-y-6">
        {/* No weights set */}
        {!hasWeights && (
          <Card className="flex flex-col items-center justify-center py-20 text-center gap-4">
            <ChartBarIcon className="h-12 w-12 text-zinc-700" />
            <div>
              <p className="text-zinc-300 font-medium">No target portfolio set</p>
              <p className="text-zinc-500 text-sm mt-1">
                Run an optimization first — your weights will be saved automatically.
              </p>
            </div>
            <Link href="/optimizer">
              <Button variant="secondary">Go to Optimizer</Button>
            </Link>
          </Card>
        )}

        {hasWeights && (
          <>
            {error && <ErrorAlert message={error} />}

            {/* Drift alert banner */}
            {data?.needs_rebalance && (
              <div className="flex items-center gap-3 rounded-xl border border-red-800/50 bg-red-950/20 px-4 py-3">
                <ExclamationTriangleIcon className="h-5 w-5 text-red-400 shrink-0" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-red-300">Rebalance recommended</p>
                  <p className="text-xs text-red-500 mt-0.5">
                    Total drift {fmtPct(data.total_drift)} exceeds {fmtPct(data.drift_threshold)} threshold ·{" "}
                    {data.positions.filter((p) => p.needs_rebalance).length} position{data.positions.filter((p) => p.needs_rebalance).length !== 1 ? "s" : ""} off-target
                    {data.missing.length > 0 && ` · ${data.missing.length} missing: ${data.missing.join(", ")}`}
                  </p>
                </div>
                <Link href="/optimizer">
                  <Button variant="secondary" className="text-xs px-3 py-1.5 shrink-0">Rebalance</Button>
                </Link>
              </div>
            )}

            {data && !data.needs_rebalance && (
              <div className="flex items-center gap-3 rounded-xl border border-emerald-800/50 bg-emerald-950/20 px-4 py-3">
                <CheckCircleIcon className="h-5 w-5 text-emerald-400 shrink-0" />
                <p className="text-sm text-emerald-300">
                  Portfolio on target · total drift {fmtPct(data.total_drift)} · within {fmtPct(data.drift_threshold)} threshold
                </p>
              </div>
            )}

            {/* Stats row */}
            {data ? (
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                <StatCard
                  label="Portfolio Value"
                  value={fmtDollar(data.account.portfolio_value)}
                  sub={`Equity: ${fmtDollar(data.account.equity)}`}
                />
                <StatCard
                  label="Unrealised P&L"
                  value={(totalPL >= 0 ? "+" : "") + fmtDollar(totalPL)}
                  color={totalPL >= 0 ? "text-emerald-400" : "text-red-400"}
                />
                <StatCard
                  label="Cash"
                  value={fmtDollar(data.account.cash)}
                  sub={`${fmtPct(data.cash_weight)} of portfolio`}
                />
                <StatCard
                  label="Total Drift"
                  value={fmtPct(data.total_drift)}
                  sub={`Threshold: ${fmtPct(data.drift_threshold)}`}
                  color={data.needs_rebalance ? "text-red-400" : "text-emerald-400"}
                />
              </div>
            ) : loading ? (
              <div className="flex items-center justify-center gap-3 py-10 text-zinc-400">
                <Spinner />
                <span className="text-sm">Fetching portfolio snapshot…</span>
              </div>
            ) : null}

            {/* Drift chart */}
            {data && (
              <Card title="Weight Drift · Current vs Target">
                <p className="mb-3 text-xs text-zinc-500">
                  Solid bars = current weight · Faint bars = target · Dashed line = rebalance threshold ·
                  <span className="text-emerald-400"> Green</span> = OK ·
                  <span className="text-amber-400"> Amber</span> = approaching ·
                  <span className="text-red-400"> Red</span> = rebalance
                </p>
                <DriftChart
                  positions={data.positions}
                  missing={data.missing}
                  driftThreshold={data.drift_threshold}
                />
                {data.untracked.length > 0 && (
                  <p className="mt-2 text-xs text-zinc-600">
                    Positions without a target weight (not shown above): {data.untracked.join(", ")}
                  </p>
                )}
              </Card>
            )}

            {/* Positions table */}
            {data && data.positions.length > 0 && (
              <Card title="Positions">
                <PositionsTable
                  positions={data.positions}
                  missing={data.missing}
                  driftThreshold={data.drift_threshold}
                />
              </Card>
            )}

            {data && data.positions.length === 0 && (
              <Card className="py-10 text-center">
                <p className="text-zinc-500 text-sm">No open positions in your Alpaca account.</p>
              </Card>
            )}
          </>
        )}
      </main>
    </div>
  );
}
