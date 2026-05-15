"use client";
import { ArrowPathIcon } from "@heroicons/react/24/outline";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import { ErrorAlert } from "@/components/ui/ErrorAlert";
import { fmtDollar } from "@/lib/formatters";
import type { AccountData } from "@/types";

interface Props {
  data: AccountData | null;
  loading: boolean;
  error: string | null;
  onRefresh: () => void;
}

export function AccountPanel({ data, loading, error, onRefresh }: Props) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
          Paper Account
        </span>
        <button
          onClick={onRefresh}
          disabled={loading}
          className="text-zinc-500 hover:text-zinc-300 transition-colors disabled:opacity-50"
          title="Refresh"
        >
          <ArrowPathIcon className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>

      {error && <ErrorAlert message={error} />}

      {!data && !loading && !error && (
        <p className="text-sm text-zinc-600 italic">Configure Alpaca API keys to view account.</p>
      )}

      {loading && !data && (
        <div className="flex justify-center py-6">
          <Spinner />
        </div>
      )}

      {data && (
        <>
          {/* Balance stats */}
          <div className="grid grid-cols-2 gap-2">
            <StatBox label="Portfolio Value" value={fmtDollar(data.account.portfolio_value)} />
            <StatBox label="Cash" value={fmtDollar(data.account.cash)} />
            <StatBox label="Equity" value={fmtDollar(data.account.equity)} />
            <StatBox label="Buying Power" value={fmtDollar(data.account.buying_power)} />
          </div>

          {/* Positions */}
          {data.positions.length > 0 ? (
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-zinc-500">
                Positions ({data.positions.length})
              </p>
              <div className="overflow-hidden rounded-lg border border-zinc-800 max-h-64 overflow-y-auto">
                <table className="w-full text-xs">
                  <thead className="sticky top-0 bg-zinc-900 border-b border-zinc-800">
                    <tr>
                      <th className="px-3 py-2 text-left font-semibold text-zinc-400">Symbol</th>
                      <th className="px-3 py-2 text-right font-semibold text-zinc-400">Qty</th>
                      <th className="px-3 py-2 text-right font-semibold text-zinc-400">Value</th>
                      <th className="px-3 py-2 text-right font-semibold text-zinc-400">P&L%</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.positions.map((p) => {
                      const pl = parseFloat(p.unrealized_plpc);
                      return (
                        <tr key={p.symbol} className="border-b border-zinc-800/50 last:border-0">
                          <td className="px-3 py-2 font-mono font-semibold text-zinc-100">
                            {p.symbol}
                          </td>
                          <td className="px-3 py-2 text-right tabular-nums text-zinc-400">
                            {p.qty}
                          </td>
                          <td className="px-3 py-2 text-right tabular-nums text-zinc-300">
                            {fmtDollar(p.market_value)}
                          </td>
                          <td
                            className={`px-3 py-2 text-right tabular-nums font-medium ${
                              pl >= 0 ? "text-green-400" : "text-red-400"
                            }`}
                          >
                            {pl >= 0 ? "+" : ""}
                            {pl.toFixed(2)}%
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <p className="text-xs text-zinc-600 italic">No open positions.</p>
          )}
        </>
      )}
    </div>
  );
}

function StatBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-zinc-800/60 px-3 py-2.5">
      <div className="text-xs text-zinc-500">{label}</div>
      <div className="mt-0.5 font-semibold tabular-nums text-zinc-100">{value}</div>
    </div>
  );
}
