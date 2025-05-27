export interface Customer {
  _id: string;
  customer_id: string;
  risk_category_label: "Low Risk" | "Medium Risk" | "High Risk";
  invoice_net_budget_rate_amount_sum: number;
  "% Past Due > 30 Days_mean": number;
  "% Past Due_mean": number;
}

export interface RiskDistribution {
  risk: string;
  count: number;
}

export interface DashboardStats {
  totalCustomers: number;
  highRiskPercentage: number;
  averagePastDue: number;
  totalInvoiceAmount: number;
  riskDistribution: RiskDistribution[];
}

export type RiskLevel = "Low Risk" | "Medium Risk" | "High Risk" | "All";
