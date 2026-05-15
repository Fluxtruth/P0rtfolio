"use client";
import { useState, useEffect } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import { ErrorAlert } from "@/components/ui/ErrorAlert";
import { TickerSelector } from "@/components/TickerSelector";
import { CorrelationHeatmap } from "@/components/CorrelationHeatmap";
import { EfficientFrontier } from "@/components/EfficientFrontier";
import { OptimizationForm } from "@/components/OptimizationForm";
import { OptimizationResults } from "@/components/OptimizationResults";
import { AccountPanel } from "@/components/AccountPanel";
import { RebalanceModal } from "@/components/RebalanceModal";
import { useCorrelation } from "@/hooks/useCorrelation";
import { useOptimization } from "@/hooks/useOptimization";
import { useFrontier } from "@/hooks/useFrontier";
import { useAccount } from "@/hooks/useAccount";
import { api } from "@/lib/api";
import type { TickerInfo, OptimizationMethod } from "@/types";
import { ChartBarIcon, BeakerIcon } from "@heroicons/react/24/outline";

const DEFAULT_TICKERS = ["AAPL", "MSFT", "NVDA", "AMZN", "TSLA", "JPM", "GLD", "TLT", "XOM", "JNJ"];

export default function OptimizerPage() {
  const [allTickers, setAllTickers] = useState<TickerInfo[]>([]);
  const [selected, setSelected] = useState<string[]>(DEFAULT_TICKERS);
  const [periodDays, setPeriodDays] = useState(252);
  const [tickerError, setTickerError] = useState<string | null>(null);

  const correlation = useCorrelation();
  const optimization = useOptimization();
  const frontier = useFrontier();
  const account = useAccount();
  const [lastRfr, setLastRfr] = useState(0.05);

  // Load ticker universe
  useEffect(() => {
    api
      .getTickers()
      .then((r) => setAllTickers(r.tickers))
      .catch(() => setTickerError("Failed to load ticker universe from backend"));
  }, []);

  const handleComputeCorrelation = () => {
    if (selected.length >= 2) {
      correlation.compute(selected, periodDays);
    }
  };

  const handleOptimize = (params: {
    method: OptimizationMethod;
    targetVolatility?: number;
    targetReturn?: number;
    riskFreeRate: number;
  }) => {
    setLastRfr(params.riskFreeRate);
    optimization.optimize({ tickers: selected, periodDays, ...params });
    // Kick off frontier computation in parallel (shares the cached price data)
    frontier.compute({
      tickers: selected,
      periodDays,
      riskFreeRate: params.riskFreeRate,
    });
  };

  const portfolioValue = account.data
    ? parseFloat(account.data.account.portfolio_value)
    : 0;

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      {/* Header */}
      <header className="border-b border-zinc-800 bg-zinc-950/80 backdrop-blur-md sticky top-0 z-40">
        <div className="mx-auto max-w-7xl px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600">
              <ChartBarIcon className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-sm font-bold text-zinc-100">Portfolio Optimizer</h1>
              <p className="text-xs text-zinc-500">Ray Dalio · Uncorrelated Returns · Alpaca Paper Trading</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="hidden sm:inline-flex items-center gap-1.5 rounded-full bg-green-900/30 px-2.5 py-1 text-xs font-medium text-green-400 ring-1 ring-inset ring-green-800/50">
              <span className="h-1.5 w-1.5 rounded-full bg-green-400 animate-pulse" />
              Paper Trading
            </span>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 space-y-6">
        {tickerError && <ErrorAlert message={tickerError} />}

        {/* Top row: Ticker selection + Account panel */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <Card title="Stock Universe · S&P 500">
              {allTickers.length > 0 ? (
                <TickerSelector
                  tickers={allTickers}
                  selected={selected}
                  onChange={setSelected}
                />
              ) : (
                <div className="flex items-center gap-3 py-6 text-zinc-500">
                  <Spinner />
                  <span className="text-sm">Loading ticker universe…</span>
                </div>
              )}
              <div className="mt-4">
                <Button
                  onClick={handleComputeCorrelation}
                  disabled={selected.length < 2 || correlation.loading}
                  variant="secondary"
                  className="w-full"
                >
                  {correlation.loading ? (
                    <>
                      <Spinner className="h-4 w-4" />
                      Fetching data…
                    </>
                  ) : (
                    "Compute Correlation Heatmap"
                  )}
                </Button>
              </div>
            </Card>
          </div>

          <div>
            <Card title="Alpaca Paper Account">
              <AccountPanel
                data={account.data}
                loading={account.loading}
                error={account.error}
                onRefresh={account.refresh}
              />
            </Card>
          </div>
        </div>

        {/* Correlation Heatmap */}
        {(correlation.data || correlation.loading || correlation.error) && (
          <Card title="Ray Dalio Correlation Clustermap">
            {correlation.error && <ErrorAlert message={correlation.error} />}
            {correlation.loading && (
              <div className="flex items-center justify-center gap-3 py-12 text-zinc-400">
                <Spinner />
                <span className="text-sm">Fetching historical data & clustering…</span>
              </div>
            )}
            {correlation.data && !correlation.loading && (
              <>
                <p className="mb-3 text-xs text-zinc-500">
                  Pearson correlation of daily returns · Ward linkage clustering · Darker blue = more uncorrelated (Ray Dalio favors these pairings)
                </p>
                <CorrelationHeatmap data={correlation.data} />
              </>
            )}
          </Card>
        )}

        {/* Optimization + Results */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
          <div className="lg:col-span-2">
            <Card title="Portfolio Optimization · PyPortfolioOpt">
              <OptimizationForm
                tickers={selected}
                periodDays={periodDays}
                onPeriodChange={setPeriodDays}
                loading={optimization.loading}
                onSubmit={handleOptimize}
              />
              {optimization.error && (
                <div className="mt-4">
                  <ErrorAlert message={optimization.error} />
                </div>
              )}
            </Card>
          </div>

          <div className="lg:col-span-3">
            {optimization.result ? (
              <Card title="Optimized Portfolio">
                <OptimizationResults
                  result={optimization.result}
                  portfolioValue={portfolioValue || undefined}
                />
                {account.data && portfolioValue > 0 && (
                  <div className="mt-5 border-t border-zinc-800 pt-5">
                    <p className="mb-3 text-xs text-zinc-500">
                      Account value: <span className="text-zinc-300 font-semibold">${portfolioValue.toLocaleString()}</span>
                    </p>
                    <RebalanceModal
                      optimizationResult={optimization.result}
                      accountValue={portfolioValue}
                      onComplete={account.refresh}
                    />
                  </div>
                )}
              </Card>
            ) : (
              <Card className="flex flex-col items-center justify-center py-16 text-center">
                <BeakerIcon className="h-12 w-12 text-zinc-700 mb-4" />
                <p className="text-zinc-500 text-sm">
                  Select tickers and run optimization to see<br />
                  portfolio weights and performance metrics.
                </p>
              </Card>
            )}
          </div>
        </div>

        {/* Efficient Frontier */}
        {(frontier.data || frontier.loading || frontier.error) && (
          <Card title="Efficient Frontier · Monte Carlo Simulation">
            {frontier.error && <ErrorAlert message={frontier.error} />}
            {frontier.loading && (
              <div className="flex items-center justify-center gap-3 py-12 text-zinc-400">
                <Spinner />
                <span className="text-sm">Sampling 3,000 portfolios…</span>
              </div>
            )}
            {frontier.data && !frontier.loading && (
              <>
                <p className="mb-3 text-xs text-zinc-500">
                  Each dot is a random portfolio · Colour = Sharpe ratio · Blue line = efficient frontier ·
                  Dashed = Capital Market Line · ★ = your optimised portfolio
                </p>
                <EfficientFrontier
                  data={frontier.data}
                  optimizationResult={optimization.result}
                />
              </>
            )}
          </Card>
        )}

        {/* Footer note */}
        <p className="text-center text-xs text-zinc-700 pb-4">
          Powered by PyPortfolioOpt · Alpaca Markets · Ledoit-Wolf Covariance Shrinkage ·{" "}
          <span className="italic">Inspired by Ray Dalio&apos;s All Weather portfolio principles</span>
        </p>
      </main>
    </div>
  );
}
