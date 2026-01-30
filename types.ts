export type CalculationMode = 'subletting' | 'management';

export interface CalculationResult {
  // Common Financials
  grossRevenue: number;     // Total money received from client
  realRevenue: number;      // Revenue excluding VAT (5%)
  operationalCost: number;  // Cost of Goods (e.g., Rent paid to landlord)
  outsourceFee: number;     // Gross fee to agent
  
  // Tax & Remittance
  tax: number;
  health: number;
  netPay: number;           // Actual amount to transfer
  
  // Profitability
  profit: number;
  margin: number;
  
  // Flags
  isTaxThresholdReached: boolean;
  isLowMargin: boolean;
  isLoss: boolean;
}

export interface SublettingState {
  rentCost: string;       // Monthly Rent Cost
  totalRevenue: string;   // Monthly Total Revenue
  outsourceRate: string;  // Percentage
}

export interface ManagementState {
  rentAmount: string;     // Object Rent Amount
  serviceFeeRate: string; // Percentage (e.g., 10%)
  splitRatio: string;     // Percentage (e.g., 50%)
}