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

export interface BacktestMetrics {
  total_return: number;
  cagr: number;
  annual_volatility: number;
  sharpe_ratio: number;
  sortino_ratio: number;
  max_drawdown: number;
  calmar_ratio: number;
  beta: number;
  alpha: number;
  win_rate: number;
  n_trading_days: number;
}

export interface EquityPoint {
  date: string;
  value: number;
}

export type BacktestEngine = "pandas" | "backtesting_py" | "zipline" | "lean";

export interface BacktestResult {
  portfolio_equity: EquityPoint[];
  benchmark_equity: EquityPoint[];
  drawdown: EquityPoint[];
  portfolio_metrics: BacktestMetrics;
  benchmark_metrics: BacktestMetrics;
  benchmark_symbol: string | null;
  tickers_used: string[];
  weights_used: Record<string, number>;
  engine_used: string;
}

export interface FrontierData {
  random_vols: number[];
  random_rets: number[];
  random_sharpes: number[];
  frontier_vols: number[];
  frontier_rets: number[];
  max_sharpe_vol: number;
  max_sharpe_ret: number;
  max_sharpe_ratio: number;
  min_vol: number;
  min_ret: number;
  cml_vols: number[];
  cml_rets: number[];
  risk_free_rate: number;
}
