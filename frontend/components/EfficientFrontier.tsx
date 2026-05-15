"use client";
import dynamic from "next/dynamic";
import type { PlotParams } from "react-plotly.js";
import { fmtPct } from "@/lib/formatters";
import type { FrontierData, OptimizationResult } from "@/types";

const Plot = dynamic<PlotParams>(() => import("react-plotly.js"), { ssr: false });

interface Props {
  data: FrontierData;
  optimizationResult?: OptimizationResult | null;
}

export function EfficientFrontier({ data, optimizationResult }: Props) {
  const {
    random_vols,
    random_rets,
    random_sharpes,
    frontier_vols,
    frontier_rets,
    max_sharpe_vol,
    max_sharpe_ret,
    max_sharpe_ratio,
    min_vol,
    min_ret,
    cml_vols,
    cml_rets,
    risk_free_rate,
  } = data;

  // Normalise sharpes for colorscale (clamp outliers)
  const sharpeMax = Math.max(...random_sharpes);
  const sharpeMin = Math.min(...random_sharpes);

  const plotData: Plotly.Data[] = [
    // 1. Monte Carlo random portfolios — scatter coloured by Sharpe
    {
      type: "scatter",
      mode: "markers",
      x: random_vols.map((v) => v * 100),
      y: random_rets.map((r) => r * 100),
      marker: {
        color: random_sharpes,
        colorscale: [
          [0, "#1e3a5f"],
          [0.3, "#2166ac"],
          [0.55, "#74add1"],
          [0.7, "#fee090"],
          [0.85, "#f46d43"],
          [1, "#d73027"],
        ],
        cmin: sharpeMin,
        cmax: sharpeMax,
        size: 4,
        opacity: 0.55,
        colorbar: {
          title: { text: "Sharpe", font: { color: "#9ca3af", size: 11 } },
          thickness: 12,
          len: 0.7,
          tickfont: { color: "#9ca3af", size: 10 },
          bgcolor: "rgba(0,0,0,0)",
          tickformat: ".2f",
        },
      },
      name: "Random portfolios",
      hovertemplate:
        "σ: %{x:.2f}%<br>μ: %{y:.2f}%<br>Sharpe: %{marker.color:.3f}<extra></extra>",
    } as Plotly.Data,

    // 2. Capital Market Line
    {
      type: "scatter",
      mode: "lines",
      x: cml_vols.map((v) => v * 100),
      y: cml_rets.map((r) => r * 100),
      line: { color: "#a3e635", width: 1.5, dash: "dot" },
      name: "Capital Market Line",
      hoverinfo: "none",
    } as Plotly.Data,

    // 3. Efficient Frontier curve
    {
      type: "scatter",
      mode: "lines",
      x: frontier_vols.map((v) => v * 100),
      y: frontier_rets.map((r) => r * 100),
      line: { color: "#60a5fa", width: 2.5 },
      name: "Efficient Frontier",
      hovertemplate: "σ: %{x:.2f}%<br>μ: %{y:.2f}%<extra>Frontier</extra>",
    } as Plotly.Data,

    // 4. Min Volatility portfolio
    {
      type: "scatter",
      mode: "text+markers",
      x: [min_vol * 100],
      y: [min_ret * 100],
      marker: { color: "#818cf8", size: 12, symbol: "diamond", line: { color: "#fff", width: 1 } },
      text: ["Min Vol"],
      textposition: "top right",
      textfont: { color: "#a5b4fc", size: 11 },
      name: "Min Volatility",
      hovertemplate: `Min Vol<br>σ: ${fmtPct(min_vol)}<br>μ: ${fmtPct(min_ret)}<extra></extra>`,
    } as Plotly.Data,

    // 5. Max Sharpe portfolio
    {
      type: "scatter",
      mode: "text+markers",
      x: [max_sharpe_vol * 100],
      y: [max_sharpe_ret * 100],
      marker: { color: "#facc15", size: 14, symbol: "star", line: { color: "#fff", width: 1 } },
      text: [`Sharpe ${max_sharpe_ratio.toFixed(2)}`],
      textposition: "top right",
      textfont: { color: "#fde68a", size: 11 },
      name: "Max Sharpe",
      hovertemplate: `Max Sharpe: ${max_sharpe_ratio.toFixed(3)}<br>σ: ${fmtPct(max_sharpe_vol)}<br>μ: ${fmtPct(max_sharpe_ret)}<extra></extra>`,
    } as Plotly.Data,

    // 6. Risk-free rate point on y-axis
    {
      type: "scatter",
      mode: "text+markers",
      x: [0],
      y: [risk_free_rate * 100],
      marker: { color: "#a3e635", size: 8, symbol: "circle", line: { color: "#fff", width: 1 } },
      text: [`Rf ${fmtPct(risk_free_rate)}`],
      textposition: "middle right",
      textfont: { color: "#bef264", size: 10 },
      name: "Risk-free rate",
      hovertemplate: `Risk-free rate: ${fmtPct(risk_free_rate)}<extra></extra>`,
    } as Plotly.Data,
  ];

  // Overlay the current optimized portfolio if provided
  if (optimizationResult) {
    plotData.push({
      type: "scatter",
      mode: "text+markers",
      x: [optimizationResult.annual_volatility * 100],
      y: [optimizationResult.expected_annual_return * 100],
      marker: {
        color: "#f472b6",
        size: 16,
        symbol: "star",
        line: { color: "#fff", width: 1.5 },
      },
      text: ["Your Portfolio"],
      textposition: "top left",
      textfont: { color: "#f9a8d4", size: 11 },
      name: "Your Portfolio",
      hovertemplate: `Your Portfolio<br>σ: ${fmtPct(optimizationResult.annual_volatility)}<br>μ: ${fmtPct(optimizationResult.expected_annual_return)}<br>Sharpe: ${optimizationResult.sharpe_ratio.toFixed(3)}<extra></extra>`,
    } as Plotly.Data);
  }

  const layout: Partial<Plotly.Layout> = {
    paper_bgcolor: "rgba(0,0,0,0)",
    plot_bgcolor: "rgba(0,0,0,0)",
    height: 480,
    margin: { l: 60, r: 20, t: 30, b: 60 },
    xaxis: {
      title: { text: "Annual Volatility (%)", font: { color: "#9ca3af", size: 12 } },
      tickfont: { color: "#9ca3af", size: 11 },
      gridcolor: "#27272a",
      zeroline: false,
      ticksuffix: "%",
    },
    yaxis: {
      title: { text: "Expected Annual Return (%)", font: { color: "#9ca3af", size: 12 } },
      tickfont: { color: "#9ca3af", size: 11 },
      gridcolor: "#27272a",
      zeroline: false,
      ticksuffix: "%",
    },
    legend: {
      font: { color: "#9ca3af", size: 11 },
      bgcolor: "rgba(0,0,0,0)",
      bordercolor: "#3f3f46",
      borderwidth: 1,
      x: 0.01,
      y: 0.99,
      xanchor: "left",
      yanchor: "top",
    },
    annotations: [
      {
        text: "Efficient Frontier · Monte Carlo Simulation (3,000 portfolios)",
        xref: "paper",
        yref: "paper",
        x: 0.5,
        y: 1.04,
        xanchor: "center",
        yanchor: "bottom",
        font: { size: 12, color: "#9ca3af" },
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
