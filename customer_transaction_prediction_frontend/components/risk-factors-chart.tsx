// components/risk-factors-chart.tsx
"use client";

import { Customer } from "@/lib/types";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { useMemo } from "react";

interface RiskFactorsChartProps {
  customers: Customer[];
}

export function RiskFactorsChart({ customers }: RiskFactorsChartProps) {
  // Analyze risk factors by calculating average metrics for each risk level
  const riskFactorsData = useMemo(() => {
    const highRisk = customers.filter(
      (c) => c.risk_category_label === "High Risk"
    );
    const mediumRisk = customers.filter(
      (c) => c.risk_category_label === "Medium Risk"
    );
    const lowRisk = customers.filter(
      (c) => c.risk_category_label === "Low Risk"
    );

    const calculateAvg = (arr: Customer[], key: keyof Customer) => {
      return (
        arr.reduce((sum, c) => sum + Number(c[key]), 0) / (arr.length || 1)
      );
    };

    // Create data structure for comparison chart
    return [
      {
        name: "Past Due > 30 Days",
        "High Risk": calculateAvg(highRisk, "% Past Due > 30 Days_mean"),
        "Medium Risk": calculateAvg(mediumRisk, "% Past Due > 30 Days_mean"),
        "Low Risk": calculateAvg(lowRisk, "% Past Due > 30 Days_mean"),
      },
      {
        name: "Total Past Due",
        "High Risk": calculateAvg(highRisk, "% Past Due_mean"),
        "Medium Risk": calculateAvg(mediumRisk, "% Past Due_mean"),
        "Low Risk": calculateAvg(lowRisk, "% Past Due_mean"),
      },
      {
        name: "Invoice Amount",
        // Normalize by dividing by 1000 to fit scale
        "High Risk":
          calculateAvg(highRisk, "invoice_net_budget_rate_amount_sum") / 1000,
        "Medium Risk":
          calculateAvg(mediumRisk, "invoice_net_budget_rate_amount_sum") / 1000,
        "Low Risk":
          calculateAvg(lowRisk, "invoice_net_budget_rate_amount_sum") / 1000,
      },
    ];
  }, [customers]);

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart
        data={riskFactorsData}
        margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
      >
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="name" />
        <YAxis
          label={{
            value: "Value (% or $ thousands)",
            angle: -90,
            position: "insideLeft",
          }}
        />
        <Tooltip
          formatter={(value: number, name: string) => {
            const isInvoice = name.includes("Invoice");
            return [
              isInvoice ? `$${value.toFixed(1)}k` : `${value.toFixed(1)}%`,
              name,
            ];
          }}
        />
        <Legend />
        <Bar dataKey="High Risk" fill="#ef4444" />
        <Bar dataKey="Medium Risk" fill="#f59e0b" />
        <Bar dataKey="Low Risk" fill="#10b981" />
      </BarChart>
    </ResponsiveContainer>
  );
}
