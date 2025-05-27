"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Calendar,
  Download,
  FileText,
  ListFilter,
  BarChart,
  PieChart,
  RefreshCw,
  Users,
} from "lucide-react";
import { Customer, DashboardStats } from "@/lib/types";
import { exportToCSV, exportToPDF } from "@/lib/export-utils";
import { useNoDataCheck } from "@/hooks/use-no-data-check";
import { NoDataAlert } from "@/components/no-data-alert";

interface ReportConfig {
  title: string;
  description: string;
  type: "csv" | "pdf";
  icon: React.ReactNode;
  sections: Array<{
    id: string;
    label: string;
    defaultChecked: boolean;
  }>;
  filters?: Array<{
    id: string;
    label: string;
    type: "radio" | "checkbox";
    options?: Array<{
      id: string;
      label: string;
    }>;
    defaultValue?: string;
  }>;
}

export default function ReportsPage() {
  const [loading, setLoading] = useState(true);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [stats, setStats] = useState<DashboardStats>({
    totalCustomers: 0,
    highRiskPercentage: 0,
    averagePastDue: 0,
    totalInvoiceAmount: 0,
    riskDistribution: [],
  });
  const { showNoDataAlert, closeAlert } = useNoDataCheck();

  const [reportTitle, setReportTitle] = useState("");
  const [selectedSections, setSelectedSections] = useState<string[]>([]);
  const [selectedFilters, setSelectedFilters] = useState<
    Record<string, string | string[]>
  >({});
  const [activeReport, setActiveReport] = useState<ReportConfig | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [generatingReport, setGeneratingReport] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await fetch("/api/customers?limit=1000");
        const data = await response.json();

        setCustomers(data.customers);
        setStats(data.stats);
      } catch (error) {
        console.error("Failed to load reports data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Initialize selections when a report is selected
  useEffect(() => {
    if (activeReport) {
      // Initialize default sections
      const defaultSections = activeReport.sections
        .filter((section) => section.defaultChecked)
        .map((section) => section.id);
      setSelectedSections(defaultSections);

      // Initialize default filters
      const defaultFilters: Record<string, string | string[]> = {};
      activeReport.filters?.forEach((filter) => {
        if (filter.defaultValue) {
          defaultFilters[filter.id] = filter.defaultValue;
        } else if (filter.type === "checkbox" && filter.options) {
          defaultFilters[filter.id] = filter.options.map((opt) => opt.id);
        }
      });
      setSelectedFilters(defaultFilters);

      // Set default report title
      setReportTitle(
        `${activeReport.title} - ${new Date().toLocaleDateString()}`
      );
    }
  }, [activeReport]);

  // Handle section toggle
  const handleSectionToggle = (sectionId: string, checked: boolean) => {
    if (checked) {
      setSelectedSections((prev) => [...prev, sectionId]);
    } else {
      setSelectedSections((prev) => prev.filter((id) => id !== sectionId));
    }
  };

  // Handle filter change
  const handleFilterChange = (filterId: string, value: string | string[]) => {
    setSelectedFilters((prev) => ({
      ...prev,
      [filterId]: value,
    }));
  };

  // Generate the report
  const generateReport = async () => {
    try {
      setGeneratingReport(true);

      // Filter customers based on selected filters
      let filteredCustomers = [...customers];

      if (activeReport?.filters) {
        activeReport.filters.forEach((filter) => {
          const selectedValue = selectedFilters[filter.id];

          if (
            filter.id === "risk_category_label" &&
            selectedValue &&
            selectedValue !== "all"
          ) {
            const riskMap: Record<string, string> = {
              high: "High Risk",
              medium: "Medium Risk",
              low: "Low Risk",
            };

            if (Array.isArray(selectedValue)) {
              // Handle checkbox case (multiple selections)
              if (selectedValue.length > 0 && selectedValue.length < 3) {
                const validRiskLevels = selectedValue
                  .map((v) => riskMap[v])
                  .filter(Boolean);
                filteredCustomers = filteredCustomers.filter((c) =>
                  validRiskLevels.includes(c.risk_category_label)
                );
              }
            } else {
              // Handle radio case (single selection)
              const riskLevel = riskMap[selectedValue];
              if (riskLevel) {
                filteredCustomers = filteredCustomers.filter(
                  (c) => c.risk_category_label === riskLevel
                );
              }
            }
          }

          if (
            filter.id === "past_due_threshold" &&
            selectedValue &&
            selectedValue !== "all"
          ) {
            const thresholdMap: Record<string, number> = {
              over_10: 10,
              over_20: 20,
              over_30: 30,
            };

            const threshold = thresholdMap[selectedValue as string];
            if (threshold) {
              filteredCustomers = filteredCustomers.filter(
                (c) => c["% Past Due_mean"] > threshold
              );
            }
          }
        });
      }

      // Generate the report based on type
      if (activeReport?.type === "csv") {
        await exportToCSV(filteredCustomers, reportTitle);
      } else if (activeReport?.type === "pdf") {
        await exportToPDF(filteredCustomers, stats, reportTitle);
      }

      setDialogOpen(false);
    } catch (error) {
      console.error("Failed to generate report:", error);
    } finally {
      setGeneratingReport(false);
    }
  };

  const reportTemplates: ReportConfig[] = [
    {
      title: "Customer Risk Summary",
      description: "Overview of customer risk levels and key metrics",
      type: "pdf",
      icon: <PieChart className="h-10 w-10 text-primary" />,
      sections: [
        { id: "summary", label: "Executive Summary", defaultChecked: true },
        {
          id: "risk_distribution",
          label: "Risk Distribution",
          defaultChecked: true,
        },
        { id: "high_risk", label: "High Risk Customers", defaultChecked: true },
        { id: "past_due", label: "Past Due Analysis", defaultChecked: true },
      ],
      filters: [
        {
          id: "risk_category_label",
          label: "Risk Level",
          type: "radio",
          options: [
            { id: "all", label: "All Risk Levels" },
            { id: "high", label: "High Risk Only" },
            { id: "medium", label: "Medium Risk Only" },
            { id: "low", label: "Low Risk Only" },
          ],
          defaultValue: "all",
        },
      ],
    },
    {
      title: "Past Due Analysis",
      description: "Detailed analysis of past due accounts",
      type: "pdf",
      icon: <BarChart className="h-10 w-10 text-primary" />,
      sections: [
        { id: "summary", label: "Summary Statistics", defaultChecked: true },
        {
          id: "past_due_30",
          label: "Past Due > 30 Days",
          defaultChecked: true,
        },
        {
          id: "past_due_total",
          label: "Total Past Due Analysis",
          defaultChecked: true,
        },
        {
          id: "customer_list",
          label: "Customer Details",
          defaultChecked: false,
        },
      ],
      filters: [
        {
          id: "past_due_threshold",
          label: "Past Due Threshold",
          type: "radio",
          options: [
            { id: "all", label: "All Customers" },
            { id: "over_10", label: "Past Due > 10%" },
            { id: "over_20", label: "Past Due > 20%" },
            { id: "over_30", label: "Past Due > 30%" },
          ],
          defaultValue: "all",
        },
      ],
    },
    {
      title: "Customer Data Export",
      description: "Complete customer data in CSV format",
      type: "csv",
      icon: <FileText className="h-10 w-10 text-primary" />,
      sections: [
        { id: "customer_id", label: "Customer ID", defaultChecked: true },
        {
          id: "risk_category_label",
          label: "Risk Level",
          defaultChecked: true,
        },
        { id: "invoice_amount", label: "Invoice Amount", defaultChecked: true },
        {
          id: "past_due_30",
          label: "Past Due > 30 Days",
          defaultChecked: true,
        },
        { id: "total_past_due", label: "Total Past Due", defaultChecked: true },
      ],
      filters: [
        {
          id: "risk_category_label",
          label: "Risk Level",
          type: "checkbox",
          options: [
            { id: "high", label: "High Risk" },
            { id: "medium", label: "Medium Risk" },
            { id: "low", label: "Low Risk" },
          ],
          defaultValue: "all",
        },
      ],
    },
    {
      title: "Monthly Risk Trends",
      description: "Analysis of risk level changes over time",
      type: "pdf",
      icon: <Calendar className="h-10 w-10 text-primary" />,
      sections: [
        { id: "trend_summary", label: "Trend Summary", defaultChecked: true },
        {
          id: "risk_changes",
          label: "Risk Level Changes",
          defaultChecked: true,
        },
        {
          id: "past_due_trends",
          label: "Past Due Trends",
          defaultChecked: true,
        },
        {
          id: "future_projections",
          label: "Future Projections",
          defaultChecked: false,
        },
      ],
    },
  ];

  if (loading) {
    return <ReportsSkeletonLoader />;
  }

  return (
    <div className="container mx-auto p-4 space-y-6">
      <div className="flex flex-col space-y-2 md:flex-row md:items-center md:justify-between md:space-y-0 px-2">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Reports</h2>
          <p className="text-muted-foreground">
            Generate and download customer risk reports
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => window.location.reload()}
        >
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh Reports
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {reportTemplates.map((report, index) => (
          <Card key={index} className="flex flex-col">
            <CardHeader>
              <div className="flex items-start gap-4">
                <div className="rounded-lg bg-primary/10 p-2">
                  {report.icon}
                </div>
                <div>
                  <CardTitle>{report.title}</CardTitle>
                  <CardDescription>{report.description}</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="flex-1">
              <div className="text-sm text-muted-foreground">
                <div className="flex items-center gap-2 mb-1">
                  <FileText className="h-4 w-4" />
                  <span>Format: {report.type.toUpperCase()}</span>
                </div>
                <div className="flex items-center gap-2">
                  <ListFilter className="h-4 w-4" />
                  <span>{report.sections.length} data sections available</span>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogTrigger asChild>
                  <Button
                    className="w-full"
                    onClick={() => setActiveReport(report)}
                  >
                    Generate Report
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px]">
                  <DialogHeader>
                    <DialogTitle>Configure Report</DialogTitle>
                    <DialogDescription>
                      Customize your report settings. You can select which
                      sections to include and apply filters.
                    </DialogDescription>
                  </DialogHeader>

                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="report-title">Report Title</Label>
                      <Input
                        id="report-title"
                        value={reportTitle}
                        onChange={(e) => setReportTitle(e.target.value)}
                      />
                    </div>

                    {activeReport && (
                      <>
                        <div className="space-y-2">
                          <Label>Included Sections</Label>
                          <div className="space-y-2">
                            {activeReport.sections.map((section) => (
                              <div
                                key={section.id}
                                className="flex items-center space-x-2"
                              >
                                <Checkbox
                                  id={`section-${section.id}`}
                                  checked={selectedSections.includes(
                                    section.id
                                  )}
                                  onCheckedChange={(checked) =>
                                    handleSectionToggle(
                                      section.id,
                                      checked as boolean
                                    )
                                  }
                                />
                                <Label htmlFor={`section-${section.id}`}>
                                  {section.label}
                                </Label>
                              </div>
                            ))}
                          </div>
                        </div>

                        {activeReport.filters &&
                          activeReport.filters.map((filter) => (
                            <div key={filter.id} className="space-y-2">
                              <Label>{filter.label}</Label>

                              {filter.type === "radio" && filter.options && (
                                <RadioGroup
                                  value={
                                    (selectedFilters[filter.id] as string) ||
                                    filter.defaultValue
                                  }
                                  onValueChange={(value: string | string[]) =>
                                    handleFilterChange(filter.id, value)
                                  }
                                >
                                  {filter.options.map((option) => (
                                    <div
                                      key={option.id}
                                      className="flex items-center space-x-2"
                                    >
                                      <RadioGroupItem
                                        value={option.id}
                                        id={`${filter.id}-${option.id}`}
                                      />
                                      <Label
                                        htmlFor={`${filter.id}-${option.id}`}
                                      >
                                        {option.label}
                                      </Label>
                                    </div>
                                  ))}
                                </RadioGroup>
                              )}

                              {filter.type === "checkbox" && filter.options && (
                                <div className="space-y-2">
                                  {filter.options.map((option) => (
                                    <div
                                      key={option.id}
                                      className="flex items-center space-x-2"
                                    >
                                      <Checkbox
                                        id={`${filter.id}-${option.id}`}
                                        checked={
                                          Array.isArray(
                                            selectedFilters[filter.id]
                                          ) &&
                                          (
                                            selectedFilters[
                                              filter.id
                                            ] as string[]
                                          ).includes(option.id)
                                        }
                                        onCheckedChange={(checked) => {
                                          const currentValue =
                                            (selectedFilters[
                                              filter.id
                                            ] as string[]) || [];
                                          if (checked) {
                                            handleFilterChange(filter.id, [
                                              ...currentValue,
                                              option.id,
                                            ]);
                                          } else {
                                            handleFilterChange(
                                              filter.id,
                                              currentValue.filter(
                                                (id) => id !== option.id
                                              )
                                            );
                                          }
                                        }}
                                      />
                                      <Label
                                        htmlFor={`${filter.id}-${option.id}`}
                                      >
                                        {option.label}
                                      </Label>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          ))}
                      </>
                    )}
                  </div>

                  <DialogFooter>
                    <Button
                      variant="outline"
                      onClick={() => setDialogOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={generateReport}
                      disabled={
                        generatingReport || selectedSections.length === 0
                      }
                    >
                      {generatingReport ? (
                        <>
                          <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                          Generating...
                        </>
                      ) : (
                        <>
                          <Download className="mr-2 h-4 w-4" />
                          Download Report
                        </>
                      )}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </CardFooter>
          </Card>
        ))}
      </div>
      <NoDataAlert isOpen={showNoDataAlert} onClose={closeAlert} />

      <div className="bg-muted rounded-lg p-4 mt-8">
        <h3 className="text-lg font-medium mb-2 flex items-center gap-2">
          <Users className="h-5 w-5" />
          Report Usage Tips
        </h3>
        <div className="text-sm text-muted-foreground space-y-2">
          <p>
            <strong>Customer Risk Summary</strong>: Generate this report for
            executive reviews and get a high-level overview of your risk
            profile.
          </p>
          <p>
            <strong>Past Due Analysis</strong>: Ideal for collection teams to
            identify accounts requiring immediate attention.
          </p>
          <p>
            <strong>Customer Data Export</strong>: Use this to download raw data
            for external analysis or system imports.
          </p>
          <p>
            <strong>Monthly Risk Trends</strong>: Track how your customer risk
            profile changes over time and identify seasonal patterns.
          </p>
        </div>
      </div>
    </div>
  );
}

function ReportsSkeletonLoader() {
  return (
    <div className="container mx-auto p-4 space-y-6">
      <div className="flex flex-col space-y-2 md:flex-row md:items-center md:justify-between md:space-y-0 px-2">
        <div>
          <Skeleton className="h-8 w-48 mb-2" />
          <Skeleton className="h-4 w-72" />
        </div>
        <div className="flex items-center space-x-2">
          <Skeleton className="h-10 w-36" />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="border rounded-lg p-6">
            <div className="flex items-start gap-4 mb-6">
              <Skeleton className="h-16 w-16 rounded-lg" />
              <div className="space-y-2">
                <Skeleton className="h-6 w-40" />
                <Skeleton className="h-4 w-48" />
              </div>
            </div>
            <div className="space-y-2 mb-6">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-32" />
            </div>
            <Skeleton className="h-10 w-full" />
          </div>
        ))}
      </div>
    </div>
  );
}
