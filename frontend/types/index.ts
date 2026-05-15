export interface TickerInfo {
  symbol: string;
  name: string;
  sector: string;
}

export interface DendrogramData {
  icoord: number[][];
  dcoord: number[][];
  ivl: string[];
}

export interface CorrelationData {
  tickers_ordered: string[];
  correlation_matrix: number[][];
  dendrogram_row: DendrogramData;
  dendrogram_col: DendrogramData;
}

export type OptimizationMethod =
  | "max_sharpe"
  | "min_volatility"
  | "efficient_risk"
  | "efficient_return";

export interface OptimizationResult {
  weights: Record<string, number>;
  expected_annual_return: number;
  annual_volatility: number;
  sharpe_ratio: number;
  method_used: string;
}

export interface Position {
  symbol: string;
  qty: string;
  market_value: string;
  unrealized_pl: string;
  current_price: string;
  unrealized_plpc: string;
}

export interface AccountInfo {
  portfolio_value: string;
  cash: string;
  buying_power: string;
  equity: string;
}

export interface AccountData {
  account: AccountInfo;
  positions: Position[];
}

export interface OrderPreview {
  symbol: string;
  side: "buy" | "sell";
  qty: number;
  estimated_value: number;
  current_price: number;
}

export interface RebalanceResult {
  orders_placed: OrderPreview[];
  orders_skipped: string[];
  total_trades: number;
  dry_run: boolean;
}
