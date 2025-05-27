import { Customer, DashboardStats } from "@/lib/types";
import { formatCurrency, formatPercentage } from "@/lib/utils";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

/**
 * Converts customer data to CSV format
 */
export function exportToCSV(
  customers: Customer[],
  fileName: string = "customer-risk-data"
) {
  // Define headers
  const headers = [
    "Customer ID",
    "Risk Level",
    "Invoice Amount ($)",
    "Past Due > 30 Days (%)",
    "Total Past Due (%)",
  ];

  // Format data rows
  const rows = customers.map((customer) => [
    customer.customer_id,
    customer.risk_category_label,
    customer.invoice_net_budget_rate_amount_sum.toFixed(2),
    customer["% Past Due > 30 Days_mean"].toFixed(2),
    customer["% Past Due_mean"].toFixed(2),
  ]);

  // Combine headers and rows
  const csvContent = [
    headers.join(","),
    ...rows.map((row) => row.join(",")),
  ].join("\n");

  // Create download link
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute(
    "download",
    `${fileName}-${new Date().toISOString().slice(0, 10)}.csv`
  );
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Generate PDF report with jsPDF
 */
export async function exportToPDF(
  customers: Customer[],
  stats: DashboardStats,
  fileName: string = "customer-risk-report"
) {
  // Dynamically import jsPDF to avoid SSR issues
  // const { jsPDF } = await import("jspdf");
  // const { default: autoTable } = await import("jspdf-autotable");

  // Create new PDF document
  const doc = new jsPDF();

  // Add title
  doc.setFontSize(18);
  doc.text("Customer Risk Analysis Report", 14, 22);
  doc.setFontSize(11);
  doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 30);

  // Add summary statistics
  doc.setFontSize(14);
  doc.text("Summary Statistics", 14, 45);
  doc.setFontSize(10);

  const summaryData = [
    ["Total Customers", stats.totalCustomers.toLocaleString()],
    ["High Risk Customers", `${stats.highRiskPercentage.toFixed(1)}%`],
    ["Average Past Due", `${stats.averagePastDue.toFixed(1)}%`],
    ["Total Invoice Amount", formatCurrency(stats.totalInvoiceAmount)],
  ];

  autoTable(doc, {
    startY: 50,
    head: [["Metric", "Value"]],
    body: summaryData,
    theme: "grid",
    headStyles: { fillColor: [66, 66, 74] },
  });

  // Add risk distribution
  doc.setFontSize(14);
  doc.text(
    "Risk Distribution",
    14,
    (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable
      .finalY + 15
  );

  const distributionData = stats.riskDistribution.map((item) => [
    item.risk,
    item.count,
    `${((item.count / stats.totalCustomers) * 100).toFixed(1)}%`,
  ]);

  autoTable(doc, {
    startY:
      (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable
        .finalY + 20,
    head: [["Risk Level", "Count", "Percentage"]],
    body: distributionData,
    theme: "grid",
    headStyles: { fillColor: [66, 66, 74] },
  });

  // Add customer table (top high risk customers)
  doc.setFontSize(14);
  doc.text(
    "Top 10 High Risk Customers",
    14,
    (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable
      .finalY + 15
  );

  const highRiskCustomers = customers
    .filter((c) => c.risk_category_label === "High Risk")
    .sort(
      (a, b) => b["% Past Due > 30 Days_mean"] - a["% Past Due > 30 Days_mean"]
    )
    .slice(0, 10);

  const customerTableData = highRiskCustomers.map((customer) => [
    customer.customer_id,
    customer.risk_category_label,
    formatCurrency(customer.invoice_net_budget_rate_amount_sum),
    formatPercentage(customer["% Past Due > 30 Days_mean"]),
    formatPercentage(customer["% Past Due_mean"]),
  ]);

  autoTable(doc, {
    startY:
      (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable
        .finalY + 20,
    head: [
      [
        "Customer ID",
        "Risk Level",
        "Invoice Amount",
        "Past Due > 30 Days",
        "Total Past Due",
      ],
    ],
    body: customerTableData,
    theme: "grid",
    headStyles: { fillColor: [66, 66, 74] },
  });

  // Add footer
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.text(
      "Confidential - For Internal Use Only",
      doc.internal.pageSize.getWidth() / 2,
      doc.internal.pageSize.getHeight() - 10,
      { align: "center" }
    );
    doc.text(
      `Page ${i} of ${pageCount}`,
      doc.internal.pageSize.getWidth() - 20,
      doc.internal.pageSize.getHeight() - 10
    );
  }

  // Save the PDF
  doc.save(`${fileName}-${new Date().toISOString().slice(0, 10)}.pdf`);
}
