"use client";
import dynamic from "next/dynamic";
import { useMemo } from "react";
import type { CorrelationData } from "@/types";
import type { PlotParams } from "react-plotly.js";

// Must be dynamic import — Plotly accesses window at module level
const Plot = dynamic<PlotParams>(() => import("react-plotly.js"), { ssr: false });

interface Props {
  data: CorrelationData;
}

function flattenDendro(icoord: number[][], dcoord: number[][]): { x: (number | null)[]; y: (number | null)[] } {
  const x: (number | null)[] = [];
  const y: (number | null)[] = [];
  for (let i = 0; i < icoord.length; i++) {
    x.push(...icoord[i], null);
    y.push(...dcoord[i], null);
  }
  return { x, y };
}

export function CorrelationHeatmap({ data }: Props) {
  const { tickers_ordered, correlation_matrix, dendrogram_col, dendrogram_row } = data;
  const n = tickers_ordered.length;

  // Flatten dendrogram branches into single traces with null separators
  const colDendro = useMemo(() => flattenDendro(dendrogram_col.icoord, dendrogram_col.dcoord), [dendrogram_col]);
  const rowDendro = useMemo(() => flattenDendro(dendrogram_row.icoord, dendrogram_row.dcoord), [dendrogram_row]);

  // Max dendrogram height for axis range
  const maxColH = Math.max(...dendrogram_col.dcoord.flat().filter(Boolean));
  const maxRowH = Math.max(...dendrogram_row.dcoord.flat().filter(Boolean));

  const plotData: Plotly.Data[] = [
    // Main correlation heatmap
    {
      type: "heatmap",
      z: correlation_matrix,
      x: tickers_ordered,
      y: tickers_ordered,
      colorscale: [
        [0, "#2166ac"],
        [0.25, "#74add1"],
        [0.5, "#f7f7f7"],
        [0.75, "#f4a582"],
        [1, "#d6604d"],
      ],
      zmin: -1,
      zmax: 1,
      xaxis: "x",
      yaxis: "y",
      colorbar: {
        thickness: 12,
        len: 0.75,
        title: { text: "ρ", font: { color: "#9ca3af" } },
        tickfont: { color: "#9ca3af", size: 10 },
        bgcolor: "rgba(0,0,0,0)",
      },
      hovertemplate: "%{y} vs %{x}: <b>%{z:.3f}</b><extra></extra>",
    } as Plotly.Data,

    // Column dendrogram (top)
    {
      type: "scatter",
      x: colDendro.x,
      y: colDendro.y,
      mode: "lines",
      line: { color: "#6b7280", width: 1 },
      xaxis: "x",
      yaxis: "y2",
      hoverinfo: "none",
      showlegend: false,
    } as Plotly.Data,

    // Row dendrogram (left) — swap x/y axes
    {
      type: "scatter",
      x: rowDendro.y,
      y: rowDendro.x,
      mode: "lines",
      line: { color: "#6b7280", width: 1 },
      xaxis: "x2",
      yaxis: "y",
      hoverinfo: "none",
      showlegend: false,
    } as Plotly.Data,
  ];

  const layout: Partial<Plotly.Layout> = {
    paper_bgcolor: "rgba(0,0,0,0)",
    plot_bgcolor: "rgba(0,0,0,0)",
    margin: { l: 10, r: 60, t: 10, b: 10 },
    height: 560,

    // Main heatmap axes
    xaxis: {
      domain: [0.14, 1],
      tickfont: { size: 10, color: "#d1d5db" },
      tickangle: -45,
      showgrid: false,
      zeroline: false,
    },
    yaxis: {
      domain: [0, 0.84],
      tickfont: { size: 10, color: "#d1d5db" },
      showgrid: false,
      zeroline: false,
      autorange: "reversed",
    },

    // Column dendrogram axis (top of heatmap)
    yaxis2: {
      domain: [0.86, 1],
      range: [0, maxColH * 1.05],
      showticklabels: false,
      zeroline: false,
      showgrid: false,
      anchor: "x",
    },

    // Row dendrogram axis (left of heatmap)
    xaxis2: {
      domain: [0, 0.12],
      range: [maxRowH * 1.05, 0],
      showticklabels: false,
      zeroline: false,
      showgrid: false,
      anchor: "y",
    },

    annotations: [
      {
        text: "Assets Clustermap (Pearson & Ward linkage)",
        xref: "paper",
        yref: "paper",
        x: 0.5,
        y: 1.02,
        xanchor: "center",
        yanchor: "bottom",
        font: { size: 13, color: "#9ca3af" },
        showarrow: false,
      },
    ],
  };

  return (
    <div className="w-full overflow-x-auto">
      <Plot
        data={plotData}
        layout={layout}
        config={{ displayModeBar: false, responsive: true }}
        style={{ width: "100%", minWidth: 480 }}
        useResizeHandler
      />
    </div>
  );
}
