export const fmtPct = (v: number, decimals = 2) =>
  `${(v * 100).toFixed(decimals)}%`;

export const fmtDollar = (v: number | string) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(Number(v));

export const fmtNum = (v: number, decimals = 4) => v.toFixed(decimals);
