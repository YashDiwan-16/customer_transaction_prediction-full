// components/past-due-trend-chart.tsx
"use client";

import { Customer } from "@/lib/types";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { useMemo } from "react";

interface PastDueTrendChartProps {
  customers: Customer[];
}

export function PastDueTrendChart({ customers }: PastDueTrendChartProps) {
  // For this demo, we'll simulate trend data based on the customer dataset
  // In a real application, you would fetch actual historical data from your database
  const trendData = useMemo(() => {
    // Group customers by risk level
    const highRisk = customers.filter(
      (c) => c.risk_category_label === "High Risk"
    );
    const mediumRisk = customers.filter(
      (c) => c.risk_category_label === "Medium Risk"
    );
    const lowRisk = customers.filter(
      (c) => c.risk_category_label === "Low Risk"
    );

    // Create simulated monthly data points
    // In reality, this would come from your database with proper time series data
    const months = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];

    // Calculate average past due percentage for each risk level
    const avgHighRiskPastDue =
      highRisk.reduce((sum, c) => sum + c["% Past Due_mean"], 0) /
      (highRisk.length || 1);
    const avgMediumRiskPastDue =
      mediumRisk.reduce((sum, c) => sum + c["% Past Due_mean"], 0) /
      (mediumRisk.length || 1);
    const avgLowRiskPastDue =
      lowRisk.reduce((sum, c) => sum + c["% Past Due_mean"], 0) /
      (lowRisk.length || 1);

    // Create simulated trend with some variability
    return months.map((month, i) => {
      // Add some random variability to simulate realistic data changes
      const variability = Math.sin(i / 2) * 5;

      return {
        month,
        "High Risk": Math.max(0, avgHighRiskPastDue + variability),
        "Medium Risk": Math.max(0, avgMediumRiskPastDue + variability / 2),
        "Low Risk": Math.max(0, avgLowRiskPastDue + variability / 3),
      };
    });
  }, [customers]);

  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart
        data={trendData}
        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
      >
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="month" />
        <YAxis
          domain={[0, 100]}
          tickFormatter={(value) => `${value}%`}
          label={{ value: "Past Due %", angle: -90, position: "insideLeft" }}
        />
        <Tooltip formatter={(value: number) => [`${value.toFixed(1)}%`, ""]} />
        <Legend />
        <Line
          type="monotone"
          dataKey="High Risk"
          stroke="#ef4444"
          strokeWidth={2}
          activeDot={{ r: 8 }}
        />
        <Line
          type="monotone"
          dataKey="Medium Risk"
          stroke="#f59e0b"
          strokeWidth={2}
        />
        <Line
          type="monotone"
          dataKey="Low Risk"
          stroke="#10b981"
          strokeWidth={2}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
