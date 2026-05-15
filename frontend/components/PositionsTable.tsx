"use client";
import { useState } from "react";
import { fmtDollar, fmtPct } from "@/lib/formatters";
import type { EnrichedPosition } from "@/types";
import { ChevronUpIcon, ChevronDownIcon } from "@heroicons/react/24/outline";

type SortKey = "symbol" | "market_value" | "unrealized_pl" | "current_weight" | "drift";

interface Props {
  positions: EnrichedPosition[];
  missing: string[];
  driftThreshold: number;
}

function DriftBar({ drift, threshold }: { drift: number; threshold: number }) {
  const pct = Math.min(Math.abs(drift) / threshold, 1) * 100;
  const color =
    Math.abs(drift) <= threshold * 0.5
      ? "bg-emerald-500"
      : Math.abs(drift) <= threshold
      ? "bg-amber-500"
      : "bg-red-500";
  return (
    <div className="flex items-center gap-2">
      <div className="w-16 rounded-full bg-zinc-800 h-1.5">
        <div className={`h-1.5 rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span
        className={`text-xs font-mono tabular-nums ${
          Math.abs(drift) > threshold ? "text-red-400" : Math.abs(drift) > threshold * 0.5 ? "text-amber-400" : "text-emerald-400"
        }`}
      >
        {drift >= 0 ? "+" : ""}
        {(drift * 100).toFixed(2)}%
      </span>
    </div>
  );
}

export function PositionsTable({ positions, missing, driftThreshold }: Props) {
  const [sortKey, setSortKey] = useState<SortKey>("drift");
  const [sortAsc, setSortAsc] = useState(false);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortAsc((a) => !a);
    else { setSortKey(key); setSortAsc(false); }
  };

  const sorted = [...positions].sort((a, b) => {
    let av: number | string = 0, bv: number | string = 0;
    if (sortKey === "symbol") { av = a.symbol; bv = b.symbol; }
    else if (sortKey === "market_value") { av = parseFloat(a.market_value); bv = parseFloat(b.market_value); }
    else if (sortKey === "unrealized_pl") { av = parseFloat(a.unrealized_pl); bv = parseFloat(b.unrealized_pl); }
    else if (sortKey === "current_weight") { av = a.current_weight; bv = b.current_weight; }
    else if (sortKey === "drift") { av = Math.abs(a.drift); bv = Math.abs(b.drift); }
    if (typeof av === "string") return sortAsc ? av.localeCompare(bv as string) : (bv as string).localeCompare(av);
    return sortAsc ? (av as number) - (bv as number) : (bv as number) - (av as number);
  });

  const Th = ({ label, k }: { label: string; k: SortKey }) => (
    <th
      onClick={() => toggleSort(k)}
      className="cursor-pointer select-none pb-2 text-right text-xs font-medium text-zinc-500 hover:text-zinc-300 first:text-left"
    >
      <span className="inline-flex items-center gap-1">
        {label}
        {sortKey === k && (sortAsc ? <ChevronUpIcon className="h-3 w-3" /> : <ChevronDownIcon className="h-3 w-3" />)}
      </span>
    </th>
  );

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-zinc-800">
            <Th label="Symbol" k="symbol" />
            <th className="pb-2 text-right text-xs font-medium text-zinc-500">Price</th>
            <th className="pb-2 text-right text-xs font-medium text-zinc-500">Qty</th>
            <Th label="Value" k="market_value" />
            <Th label="Unreal. P&L" k="unrealized_pl" />
            <Th label="Current %" k="current_weight" />
            <th className="pb-2 text-right text-xs font-medium text-zinc-500">Target %</th>
            <Th label="Drift" k="drift" />
          </tr>
        </thead>
        <tbody>
          {sorted.map((pos) => {
            const pl = parseFloat(pos.unrealized_pl);
            const plPct = parseFloat(pos.unrealized_plpc);
            return (
              <tr key={pos.symbol} className={`border-b border-zinc-800/50 last:border-0 ${pos.needs_rebalance ? "bg-red-950/10" : ""}`}>
                <td className="py-2 pr-4 text-sm font-semibold text-zinc-100">{pos.symbol}</td>
                <td className="py-2 pr-4 text-right text-xs font-mono text-zinc-300">${parseFloat(pos.current_price).toFixed(2)}</td>
                <td className="py-2 pr-4 text-right text-xs font-mono text-zinc-400">{parseFloat(pos.qty).toFixed(0)}</td>
                <td className="py-2 pr-4 text-right text-xs font-mono text-zinc-300">{fmtDollar(pos.market_value)}</td>
                <td className="py-2 pr-4 text-right text-xs font-mono">
                  <span className={pl >= 0 ? "text-emerald-400" : "text-red-400"}>
                    {pl >= 0 ? "+" : ""}{fmtDollar(pl)}
                  </span>
                  <span className={`ml-1 text-xs ${plPct >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                    ({plPct >= 0 ? "+" : ""}{plPct.toFixed(2)}%)
                  </span>
                </td>
                <td className="py-2 pr-4 text-right text-xs font-mono text-zinc-300">{fmtPct(pos.current_weight)}</td>
                <td className="py-2 pr-4 text-right text-xs font-mono text-zinc-500">{fmtPct(pos.target_weight)}</td>
                <td className="py-2"><DriftBar drift={pos.drift} threshold={driftThreshold} /></td>
              </tr>
            );
          })}
          {missing.map((sym) => (
            <tr key={sym} className="border-b border-zinc-800/50 last:border-0 bg-amber-950/10">
              <td className="py-2 pr-4 text-sm font-semibold text-amber-400">{sym}</td>
              <td colSpan={6} className="py-2 text-xs text-zinc-600 italic">Not held — target weight unmet</td>
              <td className="py-2"><DriftBar drift={-1} threshold={driftThreshold} /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
