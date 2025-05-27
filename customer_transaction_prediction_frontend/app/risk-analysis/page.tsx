"use client";

import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AlertTriangle, Download, FileText } from "lucide-react";
import { Customer, DashboardStats } from "@/lib/types";
import { Skeleton } from "@/components/ui/skeleton";
import { RiskDistributionChart } from "@/components/risk-distribution-chart";
import { exportToCSV, exportToPDF } from "@/lib/export-utils";
import { PastDueTrendChart } from "@/components/past-due-trend-chart";
import { RiskFactorsChart } from "@/components/risk-factors-chart";
import { NoDataAlert } from "@/components/no-data-alert";
import { useNoDataCheck } from "@/hooks/use-no-data-check";

export default function RiskAnalysisPage() {
  const [loading, setLoading] = useState(true);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [stats, setStats] = useState<DashboardStats | undefined>(undefined);

  const { showNoDataAlert, closeAlert } = useNoDataCheck();

  const [selectedRisk, setSelectedRisk] = useState<string>("All");

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const params = new URLSearchParams();
        if (selectedRisk !== "All") {
          params.set("risk", selectedRisk);
        }
        params.set("limit", "1000"); // Get more data for analysis

        const response = await fetch(`/api/customers?${params.toString()}`);
        const data = await response.json();

        setCustomers(data.customers);
        setStats(data.stats);
      } catch (error) {
        console.error("Failed to load risk analysis data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [selectedRisk]);

  const handleExportCSV = () => {
    exportToCSV(customers, "risk-analysis");
  };

  const handleExportPDF = async () => {
    if (stats) {
      await exportToPDF(customers, stats, "risk-analysis");
    } else {
      console.error("Cannot export PDF: stats data is not available");
    }
  };

  if (loading) {
    return <RiskAnalysisSkeletonLoader />;
  }

  return (
    <div className="container mx-auto p-4 space-y-6">
      <div className="flex flex-col space-y-2 md:flex-row md:items-center md:justify-between md:space-y-0 px-2">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Risk Analysis</h2>
          <p className="text-muted-foreground">
            Analyze customer risk patterns and factors
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <Select value={selectedRisk} onValueChange={setSelectedRisk}>
            <SelectTrigger className="w-36">
              <SelectValue placeholder="Risk Level" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All">All Risks</SelectItem>
              <SelectItem value="Low Risk">Low Risk</SelectItem>
              <SelectItem value="Medium Risk">Medium Risk</SelectItem>
              <SelectItem value="High Risk">High Risk</SelectItem>
            </SelectContent>
          </Select>

          <Button variant="outline" size="sm" onClick={handleExportCSV}>
            <FileText className="mr-2 h-4 w-4" />
            CSV
          </Button>
          <Button variant="outline" size="sm" onClick={handleExportPDF}>
            <Download className="mr-2 h-4 w-4" />
            PDF
          </Button>
        </div>
      </div>

      <Tabs defaultValue="distribution" className="space-y-4">
        <TabsList>
          <TabsTrigger value="distribution">Risk Distribution</TabsTrigger>
          <TabsTrigger value="trends">Past Due Trends</TabsTrigger>
          <TabsTrigger value="factors">Risk Factors</TabsTrigger>
        </TabsList>

        <TabsContent value="distribution" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <RiskDistributionChart data={stats?.riskDistribution || []} />

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <AlertTriangle className="h-5 w-5 text-amber-500" />
                  <span>Risk Insights</span>
                </CardTitle>
                <CardDescription>
                  Key observations from your customer data
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="rounded-md bg-muted p-4">
                  <h4 className="text-sm font-medium">High Risk Segment</h4>
                  <p className="text-sm text-muted-foreground mt-1">
                    {stats?.highRiskPercentage?.toFixed(1) || "0"}% of your
                    customers fall into the high risk category, representing
                    potential payment collection challenges.
                  </p>
                </div>

                <div className="rounded-md bg-muted p-4">
                  <h4 className="text-sm font-medium">Past Due Analysis</h4>
                  <p className="text-sm text-muted-foreground mt-1">
                    The average past due percentage across all customers is{" "}
                    {((stats?.averagePastDue || 0) * 100).toFixed(1)}%. This
                    suggests there may be opportunities to improve collection
                    processes.
                  </p>
                </div>

                <div className="rounded-md bg-muted p-4">
                  <h4 className="text-sm font-medium">Risk Distribution</h4>
                  <p className="text-sm text-muted-foreground mt-1">
                    {stats
                      ? calculateRiskDistributionInsight(stats)
                      : "No risk distribution data available"}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="trends">
          <div className="grid gap-4 md:grid-cols-1">
            <Card className="col-span-1">
              <CardHeader>
                <CardTitle>Past Due Trend Analysis</CardTitle>
                <CardDescription>
                  Average past due percentages by risk level
                </CardDescription>
              </CardHeader>
              <CardContent className="h-96">
                <PastDueTrendChart customers={customers} />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="factors">
          <div className="grid gap-4 md:grid-cols-1">
            <Card className="col-span-1">
              <CardHeader>
                <CardTitle>Risk Factors Analysis</CardTitle>
                <CardDescription>
                  Key factors contributing to customer risk levels
                </CardDescription>
              </CardHeader>
              <CardContent className="h-96">
                <RiskFactorsChart customers={customers} />
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      <NoDataAlert isOpen={showNoDataAlert} onClose={closeAlert} />
    </div>
  );
}

function calculateRiskDistributionInsight(stats: DashboardStats): string {
  const lowRiskCount =
    stats.riskDistribution.find((r) => r.risk === "Low Risk")?.count || 0;
  const medRiskCount =
    stats.riskDistribution.find((r) => r.risk === "Medium Risk")?.count || 0;
  const highRiskCount =
    stats.riskDistribution.find((r) => r.risk === "High Risk")?.count || 0;

  const lowRiskPct = (lowRiskCount / stats.totalCustomers) * 100;
  const medRiskPct = (medRiskCount / stats.totalCustomers) * 100;
  const highRiskPct = (highRiskCount / stats.totalCustomers) * 100;

  if (lowRiskPct > 70) {
    return `Your portfolio is relatively healthy with ${lowRiskPct.toFixed(
      1
    )}% of customers in the low risk category.`;
  } else if (highRiskPct > 30) {
    return `There is a concerning concentration of high risk customers (${highRiskPct.toFixed(
      1
    )}%). Consider reviewing credit policies.`;
  } else if (medRiskPct > 50) {
    return `Most of your customers (${medRiskPct.toFixed(
      1
    )}%) are in the medium risk category, suggesting moderate collection risk.`;
  } else {
    return `Your customer risk is distributed across categories, with a balanced risk profile.`;
  }
}

function RiskAnalysisSkeletonLoader() {
  return (
    <div className="container mx-auto p-4 space-y-6">
      <div className="flex flex-col space-y-2 md:flex-row md:items-center md:justify-between md:space-y-0 px-2">
        <div>
          <Skeleton className="h-8 w-48 mb-2" />
          <Skeleton className="h-4 w-72" />
        </div>
        <div className="flex items-center space-x-2">
          <Skeleton className="h-10 w-36" />
          <Skeleton className="h-10 w-20" />
          <Skeleton className="h-10 w-20" />
        </div>
      </div>

      <div className="space-y-4">
        <Skeleton className="h-10 w-72" />

        <div className="grid gap-4 md:grid-cols-2">
          <Skeleton className="h-80 w-full rounded-lg" />
          <Skeleton className="h-80 w-full rounded-lg" />
        </div>
      </div>
    </div>
  );
}
