"use client";
import dynamic from "next/dynamic";
import type { PlotParams } from "react-plotly.js";
import type { EnrichedPosition } from "@/types";

const Plot = dynamic<PlotParams>(() => import("react-plotly.js"), { ssr: false });

interface Props {
  positions: EnrichedPosition[];
  missing: string[];
  driftThreshold: number;
}

export function DriftChart({ positions, missing, driftThreshold }: Props) {
  // Combine held + missing (missing have current_weight=0, target_weight from positions list)
  const rows = [
    ...positions.filter((p) => p.target_weight > 0),
    ...missing.map((sym) => ({
      symbol: sym,
      current_weight: 0,
      target_weight: 0, // will be filled from positions that have target info
      drift: 0,
      needs_rebalance: true,
    })),
  ].sort((a, b) => Math.abs(b.drift) - Math.abs(a.drift));

  const symbols = rows.map((r) => r.symbol);
  const currentWeights = rows.map((r) => r.current_weight * 100);
  const targetWeights = rows.map((r) => r.target_weight * 100);
  const driftColors = rows.map((r) =>
    Math.abs(r.drift) <= driftThreshold * 0.5
      ? "#34d399"
      : Math.abs(r.drift) <= driftThreshold
      ? "#fbbf24"
      : "#f87171"
  );

  const plotData: Plotly.Data[] = [
    {
      type: "bar",
      orientation: "h",
      name: "Current",
      x: currentWeights,
      y: symbols,
      marker: { color: driftColors, opacity: 0.85 },
      hovertemplate: "%{y}: %{x:.2f}%<extra>Current</extra>",
    },
    {
      type: "bar",
      orientation: "h",
      name: "Target",
      x: targetWeights,
      y: symbols,
      marker: { color: "#60a5fa", opacity: 0.4 },
      hovertemplate: "%{y}: %{x:.2f}%<extra>Target</extra>",
    },
  ];

  const layout: Partial<Plotly.Layout> = {
    barmode: "overlay",
    paper_bgcolor: "rgba(0,0,0,0)",
    plot_bgcolor: "rgba(0,0,0,0)",
    height: Math.max(240, rows.length * 32 + 60),
    margin: { l: 64, r: 20, t: 10, b: 40 },
    xaxis: {
      ticksuffix: "%",
      tickfont: { color: "#9ca3af", size: 10 },
      gridcolor: "#27272a",
      zeroline: false,
    },
    yaxis: {
      tickfont: { color: "#d4d4d8", size: 11 },
      autorange: "reversed",
    },
    legend: {
      font: { color: "#9ca3af", size: 11 },
      bgcolor: "rgba(0,0,0,0)",
      orientation: "h",
      x: 0,
      y: -0.12,
    },
    shapes: [
      {
        type: "line",
        x0: driftThreshold * 100,
        x1: driftThreshold * 100,
        y0: -0.5,
        y1: rows.length - 0.5,
        line: { color: "#f87171", width: 1, dash: "dot" },
      },
    ],
  };

  return (
    <Plot
      data={plotData}
      layout={layout}
      config={{ displayModeBar: false, responsive: true }}
      style={{ width: "100%" }}
      useResizeHandler
    />
  );
}
