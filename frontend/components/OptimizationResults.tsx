"use client";
import { fmtDollar, fmtPct } from "@/lib/formatters";
import type { OptimizationResult } from "@/types";

const METHOD_LABELS: Record<string, string> = {
  max_sharpe: "Max Sharpe Ratio",
  min_volatility: "Min Volatility",
  efficient_risk: "Efficient Risk",
  efficient_return: "Efficient Return",
};

interface Props {
  result: OptimizationResult;
  portfolioValue?: number;
}

export function OptimizationResults({ result, portfolioValue }: Props) {
  const weights = Object.entries(result.weights).sort(([, a], [, b]) => b - a);

  return (
    <div className="space-y-5">
      {/* Method badge */}
      <div className="text-xs text-zinc-500">
        Method:{" "}
        <span className="font-semibold text-blue-400">
          {METHOD_LABELS[result.method_used] ?? result.method_used}
        </span>
      </div>

      {/* Metric cards */}
      <div className="grid grid-cols-3 gap-3">
        <MetricCard
          label="Expected Return"
          value={fmtPct(result.expected_annual_return)}
          color="green"
        />
        <MetricCard
          label="Annual Volatility"
          value={fmtPct(result.annual_volatility)}
          color="amber"
        />
        <MetricCard
          label="Sharpe Ratio"
          value={result.sharpe_ratio.toFixed(3)}
          color="blue"
        />
      </div>

      {/* Weights table */}
      <div className="overflow-hidden rounded-lg border border-zinc-800">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-800 bg-zinc-900">
              <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-zinc-400">
                Ticker
              </th>
              <th className="px-4 py-2.5 text-right text-xs font-semibold uppercase tracking-wider text-zinc-400">
                Weight
              </th>
              {portfolioValue && (
                <th className="px-4 py-2.5 text-right text-xs font-semibold uppercase tracking-wider text-zinc-400">
                  Allocated
                </th>
              )}
              <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-zinc-400">
                Bar
              </th>
            </tr>
          </thead>
          <tbody>
            {weights.map(([symbol, weight]) => (
              <tr key={symbol} className="border-b border-zinc-800/50 last:border-0 hover:bg-zinc-800/30">
                <td className="px-4 py-2.5 font-mono font-semibold text-zinc-100">{symbol}</td>
                <td className="px-4 py-2.5 text-right tabular-nums text-zinc-200">
                  {fmtPct(weight)}
                </td>
                {portfolioValue && (
                  <td className="px-4 py-2.5 text-right tabular-nums text-zinc-400">
                    {fmtDollar(weight * portfolioValue)}
                  </td>
                )}
                <td className="px-4 py-2.5 w-32">
                  <div className="h-2 rounded-full bg-zinc-800 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-blue-500"
                      style={{ width: `${(weight / weights[0][1]) * 100}%` }}
                    />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function MetricCard({ label, value, color }: { label: string; value: string; color: string }) {
  const textColor =
    color === "green"
      ? "text-green-400"
      : color === "amber"
      ? "text-amber-400"
      : "text-blue-400";
  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-900/60 p-3 text-center">
      <div className={`text-2xl font-bold tabular-nums ${textColor}`}>{value}</div>
      <div className="mt-1 text-xs text-zinc-500">{label}</div>
    </div>
  );
}
