"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { RiskDistribution } from "@/lib/types";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from "recharts";

interface RiskDistributionChartProps {
  data: RiskDistribution[];
}

export function RiskDistributionChart({ data }: RiskDistributionChartProps) {
  // Define colors for each risk level
  const COLORS = {
    "Low Risk": "#10b981", // green
    "Medium Risk": "#f59e0b", // amber
    "High Risk": "#ef4444", // red
  };

  // Map data to include colors
  const chartData = data.map((item) => ({
    name: item.risk,
    value: item.count,
    color: COLORS[item.risk as keyof typeof COLORS] || "#6366f1",
  }));

  return (
    <Card className="col-span-1 md:col-span-1">
      <CardHeader>
        <CardTitle>Risk Distribution</CardTitle>
        <CardDescription>Customer risk level breakdown</CardDescription>
      </CardHeader>
      <CardContent className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              labelLine={true}
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
              nameKey="name"
              label={({ name, percent }) =>
                `${name}: ${(percent * 100).toFixed(0)}%`
              }
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip
              formatter={(value: number) => [`${value} customers`, "Count"]}
            />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
