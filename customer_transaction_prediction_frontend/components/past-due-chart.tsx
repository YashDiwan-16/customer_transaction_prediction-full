"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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

interface PastDueChartProps {
  customers: Customer[];
}

export function PastDueChart({ customers }: PastDueChartProps) {
  // Process the data for the chart
  // We'll take the top 10 customers by past due percentage
  const chartData = customers
    .sort(
      (a, b) => b["% Past Due > 30 Days_mean"] - a["% Past Due > 30 Days_mean"]
    )
    .slice(0, 10)
    .map((customer) => ({
      id: customer.customer_id,
      pastDue30: customer["% Past Due > 30 Days_mean"],
      totalPastDue: customer["% Past Due_mean"],
      risk: customer.risk_category_label,
    }));
  return (
    <Card className="col-span-1 md:col-span-2">
      <CardHeader>
        <CardTitle>Top 10 Past Due Customers</CardTitle>
        <CardDescription>
          Customers with highest past due percentages
        </CardDescription>
      </CardHeader>
      <CardContent className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            layout="vertical"
            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              type="number"
              domain={[0, 100]}
              tickFormatter={(value) => `${value}%`}
            />
            <YAxis
              type="category"
              dataKey="id"
              width={100}
              tickFormatter={(value) =>
                value.length > 10 ? `${value.substring(0, 10)}...` : value
              }
            />
            <Tooltip
              formatter={(value: number, name: string) => [
                `${value.toFixed(1)}%`,
                name,
              ]}
              labelFormatter={(value) => `Customer: ${value}`}
            />
            <Legend />
            <Bar dataKey="pastDue30" name="Past Due > 30 Days" fill="#ef4444" />
            <Bar dataKey="totalPastDue" name="Total Past Due" fill="#f59e0b" />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
