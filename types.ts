export type CalculationMode = 'subletting' | 'management';

export interface CalculationResult {
  // Common Financials
  grossRevenue: number;     // Total money received from client
  realRevenue: number;      // Revenue excluding VAT (5%)
  operationalCost: number;  // Cost of Goods (Total Cost)
  
  // Breakdown
  rentCostOnly: number;     // Base rent paid to landlord
  amortizationTotal: number;// Total of extra items
  
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

export interface AmortizationItem {
  id: string;
  name: string;
  amount: string;
}

export interface SublettingState {
  rentCost: string;       // Monthly Rent Cost
  totalRevenue: string;   // Monthly Total Revenue
  outsourceRate: string;  // Percentage
  amortizationItems: AmortizationItem[]; // Dynamic list of extra costs
}

export interface ManagementState {
  rentAmount: string;     // Object Rent Amount
  serviceFeeRate: string; // Percentage (e.g., 10%)
  splitRatio: string;     // Percentage (e.g., 50%)
}

export interface SavedRecord {
  id: string;             // Unique ID (timestamp)
  timestamp: number;      // Creation time
  address: string;        // The identifier
  mode: CalculationMode;
  subletData?: SublettingState;
  mgmtData?: ManagementState;
}