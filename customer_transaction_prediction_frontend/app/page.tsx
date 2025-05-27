"use client";

import { useEffect, useState } from "react";
import { DashboardHeader } from "@/components/dashboard-header";
import { KpiCard } from "@/components/kpi-card";
import { RiskDistributionChart } from "@/components/risk-distribution-chart";
import { PastDueChart } from "@/components/past-due-chart";
import { Customer, DashboardStats } from "@/lib/types";
import { formatCurrency, formatPercentage, getRiskColor } from "@/lib/utils";
import { AlertTriangle, DollarSign, Percent, Users } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { NoDataAlert } from "@/components/no-data-alert";
import { useNoDataCheck } from "@/hooks/use-no-data-check";

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [stats, setStats] = useState<DashboardStats | undefined>(undefined);

  const { showNoDataAlert, closeAlert } = useNoDataCheck();

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await fetch("/api/customers");
        const data = await response.json();
        console.log("Fetched data:", data);
        setCustomers(data.customers);
        setStats(data.stats);
      } catch (error) {
        console.error("Failed to load dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="container mx-auto p-4 space-y-6">
      <DashboardHeader stats={stats} />

      <div className="grid gap-4 md:grid-cols-4">
        <KpiCard
          title="Total Customers"
          value={stats?.totalCustomers.toLocaleString() || "0"}
          description="Total customers in the system"
          icon={<Users className="h-4 w-4" />}
        />

        <KpiCard
          title="High Risk Customers"
          value={formatPercentage(stats?.highRiskPercentage ?? 0) || "0%"}
          description="Percentage of high risk customers"
          icon={<AlertTriangle className="h-4 w-4" />}
          colorClass={getRiskColor("High Risk")}
        />

        <KpiCard
          title="Average Past Due"
          value={formatPercentage((stats?.averagePastDue ?? 0) * 100) || "0%"}
          description="Average past due across all customers"
          icon={<Percent className="h-4 w-4" />}
        />

        <KpiCard
          title="Total Invoice Amount"
          value={formatCurrency(stats?.totalInvoiceAmount ?? 0)}
          description="Total amount across all invoices"
          icon={<DollarSign className="h-4 w-4" />}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <RiskDistributionChart data={stats?.riskDistribution || []} />
        <PastDueChart customers={customers} />
      </div>

      <NoDataAlert isOpen={showNoDataAlert} onClose={closeAlert} />
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="container mx-auto p-4 space-y-6">
      <div className="flex flex-col space-y-2 md:flex-row md:items-center md:justify-between md:space-y-0 px-6 py-4">
        <div>
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-80 mt-2" />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-lg border bg-card p-4">
            <Skeleton className="h-5 w-1/2 mb-2" />
            <Skeleton className="h-8 w-24" />
            <Skeleton className="h-4 w-3/4 mt-2" />
          </div>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-lg border bg-card">
          <Skeleton className="h-80 w-full rounded-lg" />
        </div>
        <div className="rounded-lg border bg-card md:col-span-2">
          <Skeleton className="h-80 w-full rounded-lg" />
        </div>
      </div>
    </div>
  );
}
