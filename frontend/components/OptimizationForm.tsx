"use client";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import type { OptimizationMethod } from "@/types";

const METHODS: { value: OptimizationMethod; label: string; description: string }[] = [
  { value: "max_sharpe", label: "Max Sharpe Ratio", description: "Best risk-adjusted return" },
  { value: "min_volatility", label: "Min Volatility", description: "Lowest possible variance" },
  { value: "efficient_risk", label: "Efficient Risk", description: "Max return at target volatility" },
  { value: "efficient_return", label: "Efficient Return", description: "Min risk at target return" },
];

interface Props {
  tickers: string[];
  periodDays: number;
  onPeriodChange: (days: number) => void;
  loading: boolean;
  onSubmit: (params: {
    method: OptimizationMethod;
    targetVolatility?: number;
    targetReturn?: number;
    riskFreeRate: number;
  }) => void;
}

export function OptimizationForm({ tickers, periodDays, onPeriodChange, loading, onSubmit }: Props) {
  const [method, setMethod] = useState<OptimizationMethod>("max_sharpe");
  const [targetVol, setTargetVol] = useState(15);
  const [targetRet, setTargetRet] = useState(10);
  const [rfr, setRfr] = useState(5);

  const handleSubmit = () => {
    onSubmit({
      method,
      targetVolatility: method === "efficient_risk" ? targetVol / 100 : undefined,
      targetReturn: method === "efficient_return" ? targetRet / 100 : undefined,
      riskFreeRate: rfr / 100,
    });
  };

  return (
    <div className="space-y-5">
      {/* Lookback period */}
      <div>
        <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-zinc-400">
          Lookback Period
        </label>
        <div className="flex gap-2">
          {[63, 126, 252, 504].map((d) => (
            <button
              key={d}
              onClick={() => onPeriodChange(d)}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                periodDays === d
                  ? "bg-blue-600 text-white"
                  : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700"
              }`}
            >
              {d === 63 ? "3M" : d === 126 ? "6M" : d === 252 ? "1Y" : "2Y"}
            </button>
          ))}
        </div>
      </div>

      {/* Optimization method */}
      <div>
        <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-zinc-400">
          Optimization Method
        </label>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {METHODS.map((m) => (
            <button
              key={m.value}
              onClick={() => setMethod(m.value)}
              className={`rounded-lg border p-3 text-left transition-colors ${
                method === m.value
                  ? "border-blue-600 bg-blue-950/40 text-blue-300"
                  : "border-zinc-700 bg-zinc-800/50 text-zinc-400 hover:border-zinc-600"
              }`}
            >
              <div className="font-medium text-sm">{m.label}</div>
              <div className="text-xs opacity-70 mt-0.5">{m.description}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Conditional param inputs */}
      {method === "efficient_risk" && (
        <div>
          <label className="mb-2 flex justify-between text-xs font-semibold uppercase tracking-wider text-zinc-400">
            <span>Target Annual Volatility</span>
            <span className="text-blue-400">{targetVol}%</span>
          </label>
          <input
            type="range"
            min={5}
            max={50}
            step={1}
            value={targetVol}
            onChange={(e) => setTargetVol(Number(e.target.value))}
            className="w-full accent-blue-500"
          />
        </div>
      )}

      {method === "efficient_return" && (
        <div>
          <label className="mb-2 flex justify-between text-xs font-semibold uppercase tracking-wider text-zinc-400">
            <span>Target Annual Return</span>
            <span className="text-blue-400">{targetRet}%</span>
          </label>
          <input
            type="range"
            min={1}
            max={60}
            step={1}
            value={targetRet}
            onChange={(e) => setTargetRet(Number(e.target.value))}
            className="w-full accent-blue-500"
          />
        </div>
      )}

      {/* Risk-free rate */}
      <div>
        <label className="mb-2 flex justify-between text-xs font-semibold uppercase tracking-wider text-zinc-400">
          <span>Risk-Free Rate</span>
          <span className="text-zinc-300">{rfr}%</span>
        </label>
        <input
          type="range"
          min={0}
          max={10}
          step={0.25}
          value={rfr}
          onChange={(e) => setRfr(Number(e.target.value))}
          className="w-full accent-blue-500"
        />
      </div>

      <Button
        onClick={handleSubmit}
        disabled={loading || tickers.length < 2}
        className="w-full"
        size="lg"
      >
        {loading ? (
          <>
            <Spinner className="h-4 w-4" />
            Optimizing…
          </>
        ) : (
          "Optimize Portfolio"
        )}
      </Button>

      {tickers.length < 2 && (
        <p className="text-center text-xs text-zinc-500">Select at least 2 tickers to optimize</p>
      )}
    </div>
  );
}
