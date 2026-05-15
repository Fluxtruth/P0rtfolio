"use client";
import { useState, useMemo } from "react";
import { MagnifyingGlassIcon, XMarkIcon } from "@heroicons/react/24/outline";
import type { TickerInfo } from "@/types";

const SECTOR_COLORS: Record<string, "blue" | "green" | "red" | "zinc" | "amber"> = {
  Technology: "blue",
  Healthcare: "green",
  Financials: "amber",
  Energy: "red",
  "Consumer Discretionary": "blue",
  "Consumer Staples": "green",
  Industrials: "zinc",
  "Communication Services": "blue",
  Materials: "green",
  Utilities: "zinc",
  "Real Estate": "amber",
  Commodities: "amber",
  Bonds: "zinc",
  ETF: "zinc",
};

interface Props {
  tickers: TickerInfo[];
  selected: string[];
  onChange: (symbols: string[]) => void;
}

export function TickerSelector({ tickers, selected, onChange }: Props) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    if (!query) return tickers;
    const q = query.toUpperCase();
    return tickers.filter(
      (t) =>
        t.symbol.includes(q) ||
        t.name.toUpperCase().includes(q) ||
        t.sector.toUpperCase().includes(q)
    );
  }, [tickers, query]);

  const grouped = useMemo(() => {
    const map: Record<string, TickerInfo[]> = {};
    for (const t of filtered) {
      (map[t.sector] ??= []).push(t);
    }
    return map;
  }, [filtered]);

  const toggle = (symbol: string) => {
    onChange(
      selected.includes(symbol) ? selected.filter((s) => s !== symbol) : [...selected, symbol]
    );
  };

  const toggleSector = (sector: string) => {
    const sectorSymbols = tickers.filter((t) => t.sector === sector).map((t) => t.symbol);
    const allSelected = sectorSymbols.every((s) => selected.includes(s));
    if (allSelected) {
      onChange(selected.filter((s) => !sectorSymbols.includes(s)));
    } else {
      const toAdd = sectorSymbols.filter((s) => !selected.includes(s));
      onChange([...selected, ...toAdd]);
    }
  };

  return (
    <div className="space-y-3">
      {/* Search input */}
      <div className="relative">
        <MagnifyingGlassIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
        <input
          className="w-full rounded-lg border border-zinc-700 bg-zinc-800 py-2 pl-9 pr-4 text-sm text-zinc-100 placeholder-zinc-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          placeholder="Search by ticker, name, or sector…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      {/* Selected chips */}
      {selected.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {selected.map((sym) => {
            const info = tickers.find((t) => t.symbol === sym);
            return (
              <span
                key={sym}
                className="inline-flex items-center gap-1 rounded-full bg-blue-900/40 px-2.5 py-1 text-xs font-medium text-blue-300 ring-1 ring-inset ring-blue-800/50"
              >
                {sym}
                <button
                  onClick={() => toggle(sym)}
                  className="ml-0.5 rounded-full hover:text-blue-100"
                >
                  <XMarkIcon className="h-3 w-3" />
                </button>
              </span>
            );
          })}
          <button
            onClick={() => onChange([])}
            className="text-xs text-zinc-500 hover:text-zinc-300 underline self-center"
          >
            Clear all
          </button>
        </div>
      )}

      <p className="text-xs text-zinc-500">
        {selected.length} selected · Recommended: 5–20 tickers
      </p>

      {/* Grouped list */}
      <div className="max-h-80 overflow-y-auto rounded-lg border border-zinc-800 bg-zinc-950">
        {Object.entries(grouped).map(([sector, items]) => (
          <div key={sector}>
            <div className="flex items-center justify-between sticky top-0 bg-zinc-900 px-3 py-1.5">
              <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                {sector}
              </span>
              <button
                onClick={() => toggleSector(sector)}
                className="text-xs text-blue-400 hover:text-blue-300"
              >
                {items.every((t) => selected.includes(t.symbol)) ? "Deselect" : "Select"} all
              </button>
            </div>
            {items.map((t) => (
              <button
                key={t.symbol}
                onClick={() => toggle(t.symbol)}
                className={`flex w-full items-center gap-3 px-3 py-2 text-left text-sm transition-colors hover:bg-zinc-800 ${
                  selected.includes(t.symbol) ? "bg-blue-950/30" : ""
                }`}
              >
                <span
                  className={`h-4 w-4 flex-shrink-0 rounded border ${
                    selected.includes(t.symbol)
                      ? "border-blue-500 bg-blue-500"
                      : "border-zinc-600 bg-transparent"
                  } flex items-center justify-center`}
                >
                  {selected.includes(t.symbol) && (
                    <svg className="h-3 w-3 text-white" fill="none" viewBox="0 0 12 12">
                      <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    </svg>
                  )}
                </span>
                <span className="w-14 font-mono font-semibold text-zinc-100">{t.symbol}</span>
                <span className="flex-1 truncate text-zinc-400">{t.name}</span>
              </button>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
