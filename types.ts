export interface CalculationResult {
  tax: number;
  health: number;
  netPay: number;
  realRevenue: number;
  profit: number;
  margin: number;
  isTaxThresholdReached: boolean;
  isLowMargin: boolean;
}

export interface InputState {
  revenue: string;
  cost: string;
}