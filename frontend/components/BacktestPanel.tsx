"use client";
import dynamic from "next/dynamic";
import type { PlotParams } from "react-plotly.js";
import { fmtPct } from "@/lib/formatters";
import type { BacktestResult, BacktestMetrics } from "@/types";

const Plot = dynamic<PlotParams>(() => import("react-plotly.js"), { ssr: false });

interface Props {
  result: BacktestResult;
}

function MetricRow({
  label,
  portfolio,
  benchmark,
  format,
  good,
}: {
  label: string;
  portfolio: number;
  benchmark: number;
  format: (v: number) => string;
  good: "high" | "low";
}) {
  const portBetter = good === "high" ? portfolio >= benchmark : portfolio <= benchmark;
  return (
    <tr className="border-b border-zinc-800 last:border-0">
      <td className="py-2 pr-4 text-xs text-zinc-400">{label}</td>
      <td
        className={`py-2 pr-4 text-right text-xs font-mono font-semibold ${
          portBetter ? "text-emerald-400" : "text-red-400"
        }`}
      >
        {format(portfolio)}
      </td>
      <td className="py-2 text-right text-xs font-mono text-zinc-400">{format(benchmark)}</td>
    </tr>
  );
}

function MetricsTable({ port, bench, benchSymbol }: { port: BacktestMetrics; bench: BacktestMetrics; benchSymbol: string }) {
  return (
    <table className="w-full">
      <thead>
        <tr className="border-b border-zinc-700">
          <th className="pb-2 text-left text-xs font-medium text-zinc-500">Metric</th>
          <th className="pb-2 text-right text-xs font-medium text-blue-400">Portfolio</th>
          <th className="pb-2 text-right text-xs font-medium text-zinc-500">{benchSymbol}</th>
        </tr>
      </thead>
      <tbody>
        <MetricRow label="Total Return" portfolio={port.total_return} benchmark={bench.total_return} format={fmtPct} good="high" />
        <MetricRow label="CAGR" portfolio={port.cagr} benchmark={bench.cagr} format={fmtPct} good="high" />
        <MetricRow label="Ann. Volatility" portfolio={port.annual_volatility} benchmark={bench.annual_volatility} format={fmtPct} good="low" />
        <MetricRow label="Sharpe Ratio" portfolio={port.sharpe_ratio} benchmark={bench.sharpe_ratio} format={(v) => v.toFixed(3)} good="high" />
        <MetricRow label="Sortino Ratio" portfolio={port.sortino_ratio} benchmark={bench.sortino_ratio} format={(v) => v.toFixed(3)} good="high" />
        <MetricRow label="Max Drawdown" portfolio={port.max_drawdown} benchmark={bench.max_drawdown} format={fmtPct} good="high" />
        <MetricRow label="Calmar Ratio" portfolio={port.calmar_ratio} benchmark={bench.calmar_ratio} format={(v) => v.toFixed(3)} good="high" />
        <MetricRow label="Beta" portfolio={port.beta} benchmark={bench.beta} format={(v) => v.toFixed(3)} good="low" />
        <MetricRow label="Alpha (ann.)" portfolio={port.alpha} benchmark={0} format={fmtPct} good="high" />
        <MetricRow label="Win Rate" portfolio={port.win_rate} benchmark={bench.win_rate} format={fmtPct} good="high" />
      </tbody>
    </table>
  );
}

const ENGINE_LABELS: Record<string, { label: string; color: string; note?: string }> = {
  pandas: { label: "pandas / numpy", color: "bg-blue-900/40 text-blue-300 ring-blue-800/50" },
  backtesting_py: { label: "backtesting.py", color: "bg-violet-900/40 text-violet-300 ring-violet-800/50" },
  zipline: { label: "Zipline (Quantopian)", color: "bg-amber-900/40 text-amber-300 ring-amber-800/50" },
  lean: { label: "LEAN (QuantConnect)", color: "bg-emerald-900/40 text-emerald-300 ring-emerald-800/50", note: "Requires Docker daemon" },
};

export function BacktestPanel({ result }: Props) {
  const { portfolio_equity, benchmark_equity, drawdown, portfolio_metrics, benchmark_metrics, benchmark_symbol, engine_used } = result;
  const engineMeta = ENGINE_LABELS[engine_used] ?? { label: engine_used, color: "bg-zinc-800 text-zinc-300 ring-zinc-700" };
  const bench = benchmark_symbol ?? "SPY";

  const dates = portfolio_equity.map((p) => p.date);
  const portVals = portfolio_equity.map((p) => p.value);
  const benchVals = benchmark_equity.map((p) => p.value);
  const ddVals = drawdown.map((p) => p.value);

  const equityData: Plotly.Data[] = [
    {
      type: "scatter",
      mode: "lines",
      x: dates,
      y: portVals,
      name: "Portfolio",
      line: { color: "#60a5fa", width: 2 },
      hovertemplate: "%{x}<br>$%{y:.2f}<extra>Portfolio</extra>",
    },
    {
      type: "scatter",
      mode: "lines",
      x: dates,
      y: benchVals,
      name: bench,
      line: { color: "#a1a1aa", width: 1.5, dash: "dot" },
      hovertemplate: `%{x}<br>$%{y:.2f}<extra>${bench}</extra>`,
    },
  ];

  const ddData: Plotly.Data[] = [
    {
      type: "scatter",
      mode: "lines",
      x: dates,
      y: ddVals,
      name: "Drawdown",
      fill: "tozeroy",
      line: { color: "#f87171", width: 1 },
      fillcolor: "rgba(248,113,113,0.15)",
      hovertemplate: "%{x}<br>%{y:.2f}%<extra>Drawdown</extra>",
    },
  ];

  const baseLayout: Partial<Plotly.Layout> = {
    paper_bgcolor: "rgba(0,0,0,0)",
    plot_bgcolor: "rgba(0,0,0,0)",
    margin: { l: 60, r: 20, t: 10, b: 40 },
    xaxis: { tickfont: { color: "#9ca3af", size: 10 }, gridcolor: "#27272a", zeroline: false },
    yaxis: { tickfont: { color: "#9ca3af", size: 10 }, gridcolor: "#27272a", zeroline: false },
    legend: { font: { color: "#9ca3af", size: 11 }, bgcolor: "rgba(0,0,0,0)", x: 0.01, y: 0.99, xanchor: "left", yanchor: "top" },
  };

  return (
    <div className="space-y-6">
      {/* Engine badge */}
      <div className="flex items-center gap-2">
        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${engineMeta.color}`}>
          {engineMeta.label}
        </span>
        {engineMeta.note && (
          <span className="text-xs text-zinc-500">{engineMeta.note}</span>
        )}
      </div>

      {/* Equity curve */}
      <div>
        <p className="mb-1 text-xs text-zinc-500">Equity curve · normalised to $100</p>
        <Plot
          data={equityData}
          layout={{ ...baseLayout, height: 300, yaxis: { ...baseLayout.yaxis, tickprefix: "$" } }}
          config={{ displayModeBar: false, responsive: true }}
          style={{ width: "100%" }}
          useResizeHandler
        />
      </div>

      {/* Drawdown */}
      <div>
        <p className="mb-1 text-xs text-zinc-500">Portfolio drawdown (%)</p>
        <Plot
          data={ddData}
          layout={{ ...baseLayout, height: 160, yaxis: { ...baseLayout.yaxis, ticksuffix: "%" } }}
          config={{ displayModeBar: false, responsive: true }}
          style={{ width: "100%" }}
          useResizeHandler
        />
      </div>

      {/* Metrics table */}
      <div>
        <p className="mb-2 text-xs text-zinc-500">
          Performance metrics · {portfolio_metrics.n_trading_days} trading days ·{" "}
          <span className="text-emerald-400">green = outperforms {bench}</span>
        </p>
        <MetricsTable port={portfolio_metrics} bench={benchmark_metrics} benchSymbol={bench} />
      </div>
    </div>
  );
}
