import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { Customer } from "@/lib/types";

/**
 * Comprehensive risk analysis API endpoint
 * This API generates full risk analytics based on customer data in MongoDB
 */
export async function GET() {
  try {
    const client = await clientPromise;
    const db = client.db();
    const collection = db.collection("customer_risk_classifications");

    // Get all customers
    const customers = (await collection
      .find({})
      .toArray()) as unknown as Customer[];

    if (customers.length === 0) {
      return NextResponse.json(
        { error: "No customer data found in the database" },
        { status: 404 }
      );
    }

    // Generate comprehensive risk analysis
    const analysis = await generateAnalysis(customers);

    return NextResponse.json(analysis);
  } catch (error) {
    console.error("API Error:", error);
    return NextResponse.json(
      { error: "Failed to generate risk analysis" },
      { status: 500 }
    );
  }
}

async function generateAnalysis(customers: Customer[]) {
  // Calculate summary statistics
  const totalCustomers = customers.length;
  const totalInvoiceAmount = customers.reduce(
    (sum, c) => sum + c.invoice_net_budget_rate_amount_sum,
    0
  );

  // Calculate weighted averages for past due metrics
  let weightedPastDue = 0;
  let weightedPastDue30 = 0;

  customers.forEach((c) => {
    const weight = c.invoice_net_budget_rate_amount_sum / totalInvoiceAmount;
    weightedPastDue += c["% Past Due_mean"] * weight;
    weightedPastDue30 += c["% Past Due > 30 Days_mean"] * weight;
  });

  // Group customers by risk level (using the risk_category_label field that comes from risk_category_label)
  const lowRiskCustomers = customers.filter(
    (c) => c.risk_category_label === "Low Risk"
  );
  const mediumRiskCustomers = customers.filter(
    (c) => c.risk_category_label === "Medium Risk"
  );
  const highRiskCustomers = customers.filter(
    (c) => c.risk_category_label === "High Risk"
  );

  // Customer counts by risk level
  const lowRiskCount = lowRiskCustomers.length;
  const mediumRiskCount = mediumRiskCustomers.length;
  const highRiskCount = highRiskCustomers.length;

  // Invoice amounts by risk level
  const lowRiskAmount = lowRiskCustomers.reduce(
    (sum, c) => sum + c.invoice_net_budget_rate_amount_sum,
    0
  );
  const mediumRiskAmount = mediumRiskCustomers.reduce(
    (sum, c) => sum + c.invoice_net_budget_rate_amount_sum,
    0
  );
  const highRiskAmount = highRiskCustomers.reduce(
    (sum, c) => sum + c.invoice_net_budget_rate_amount_sum,
    0
  );

  // Calculate average past due percentages by risk level
  const calculateAvgPastDue = (customers: Customer[]) => {
    if (customers.length === 0) return 0;
    return (
      customers.reduce((sum, c) => sum + c["% Past Due_mean"], 0) /
      customers.length
    );
  };

  const calculateAvgPastDue30 = (customers: Customer[]) => {
    if (customers.length === 0) return 0;
    return (
      customers.reduce((sum, c) => sum + c["% Past Due > 30 Days_mean"], 0) /
      customers.length
    );
  };

  const lowRiskAvgPastDue = calculateAvgPastDue(lowRiskCustomers);
  const lowRiskAvgPastDue30 = calculateAvgPastDue30(lowRiskCustomers);
  const mediumRiskAvgPastDue = calculateAvgPastDue(mediumRiskCustomers);
  const mediumRiskAvgPastDue30 = calculateAvgPastDue30(mediumRiskCustomers);
  const highRiskAvgPastDue = calculateAvgPastDue(highRiskCustomers);
  const highRiskAvgPastDue30 = calculateAvgPastDue30(highRiskCustomers);

  // Risk distribution by invoice amount range
  const invoiceRanges = [
    { min: 0, max: 10000, label: "$0 - $10K" },
    { min: 10000, max: 50000, label: "$10K - $50K" },
    { min: 50000, max: 100000, label: "$50K - $100K" },
    { min: 100000, max: 500000, label: "$100K - $500K" },
    { min: 500000, max: Infinity, label: "$500K+" },
  ];

  const riskByInvoiceAmount = invoiceRanges.map((range) => {
    const rangeCustomers = customers.filter(
      (c) =>
        c.invoice_net_budget_rate_amount_sum >= range.min &&
        c.invoice_net_budget_rate_amount_sum < range.max
    );

    const rangeTotal = rangeCustomers.length;
    const rangeLowRisk = rangeCustomers.filter(
      (c) => c.risk_category_label === "Low Risk"
    ).length;
    const rangeMediumRisk = rangeCustomers.filter(
      (c) => c.risk_category_label === "Medium Risk"
    ).length;
    const rangeHighRisk = rangeCustomers.filter(
      (c) => c.risk_category_label === "High Risk"
    ).length;

    return {
      range: range.label,
      total: rangeTotal,
      lowRisk: rangeLowRisk,
      lowRiskPct: rangeTotal > 0 ? (rangeLowRisk / rangeTotal) * 100 : 0,
      mediumRisk: rangeMediumRisk,
      mediumRiskPct: rangeTotal > 0 ? (rangeMediumRisk / rangeTotal) * 100 : 0,
      highRisk: rangeHighRisk,
      highRiskPct: rangeTotal > 0 ? (rangeHighRisk / rangeTotal) * 100 : 0,
    };
  });

  // Past due distribution analysis
  const pastDueRanges = [
    { min: 0, max: 5, label: "0-5%" },
    { min: 5, max: 10, label: "5-10%" },
    { min: 10, max: 20, label: "10-20%" },
    { min: 20, max: 30, label: "20-30%" },
    { min: 30, max: 50, label: "30-50%" },
    { min: 50, max: 100, label: "50%+" },
  ];

  const pastDueDistribution = pastDueRanges.map((range) => {
    const rangeCustomers = customers.filter(
      (c) =>
        c["% Past Due > 30 Days_mean"] >= range.min &&
        c["% Past Due > 30 Days_mean"] < range.max
    );

    const invoiceAmount = rangeCustomers.reduce(
      (sum, c) => sum + c.invoice_net_budget_rate_amount_sum,
      0
    );

    return {
      range: range.label,
      customerCount: rangeCustomers.length,
      customerPct: (rangeCustomers.length / totalCustomers) * 100,
      invoiceAmount,
      invoicePct: (invoiceAmount / totalInvoiceAmount) * 100,
    };
  });

  // Risk threshold simulation - how distribution changes with different thresholds
  const thresholds = [5, 10, 15, 20, 25, 30];
  const thresholdAnalysis = thresholds.map((threshold) => {
    const lowRisk = customers.filter(
      (c) => c["% Past Due > 30 Days_mean"] < threshold / 2
    ).length;
    const mediumRisk = customers.filter(
      (c) =>
        c["% Past Due > 30 Days_mean"] >= threshold / 2 &&
        c["% Past Due > 30 Days_mean"] < threshold
    ).length;
    const highRisk = customers.filter(
      (c) => c["% Past Due > 30 Days_mean"] >= threshold
    ).length;

    return {
      threshold: `${threshold}%`,
      lowRisk,
      lowRiskPct: (lowRisk / totalCustomers) * 100,
      mediumRisk,
      mediumRiskPct: (mediumRisk / totalCustomers) * 100,
      highRisk,
      highRiskPct: (highRisk / totalCustomers) * 100,
    };
  });

  // Top high-risk customers
  const topRiskCustomers = customers
    .filter((c) => c.risk_category_label === "High Risk")
    .sort((a, b) =>
      // Sort by past due percentage first, then by invoice amount
      b["% Past Due > 30 Days_mean"] === a["% Past Due > 30 Days_mean"]
        ? b.invoice_net_budget_rate_amount_sum -
          a.invoice_net_budget_rate_amount_sum
        : b["% Past Due > 30 Days_mean"] - a["% Past Due > 30 Days_mean"]
    )
    .slice(0, 20)
    .map((c) => ({
      customer_id: c.customer_id,
      invoice_amount: c.invoice_net_budget_rate_amount_sum,
      past_due_30: c["% Past Due > 30 Days_mean"],
      total_past_due: c["% Past Due_mean"],
    }));

  // Compile the complete analysis
  return {
    summary: {
      totalCustomers,
      totalInvoiceAmount,
      averagePastDue: weightedPastDue,
      averagePastDue30: weightedPastDue30,
      riskDistribution: {
        lowRisk: {
          count: lowRiskCount,
          percentage: (lowRiskCount / totalCustomers) * 100,
          invoiceAmount: lowRiskAmount,
          invoicePercentage: (lowRiskAmount / totalInvoiceAmount) * 100,
          avgPastDue: lowRiskAvgPastDue,
          avgPastDue30: lowRiskAvgPastDue30,
        },
        mediumRisk: {
          count: mediumRiskCount,
          percentage: (mediumRiskCount / totalCustomers) * 100,
          invoiceAmount: mediumRiskAmount,
          invoicePercentage: (mediumRiskAmount / totalInvoiceAmount) * 100,
          avgPastDue: mediumRiskAvgPastDue,
          avgPastDue30: mediumRiskAvgPastDue30,
        },
        highRisk: {
          count: highRiskCount,
          percentage: (highRiskCount / totalCustomers) * 100,
          invoiceAmount: highRiskAmount,
          invoicePercentage: (highRiskAmount / totalInvoiceAmount) * 100,
          avgPastDue: highRiskAvgPastDue,
          avgPastDue30: highRiskAvgPastDue30,
        },
      },
    },
    riskByInvoiceAmount,
    pastDueDistribution,
    thresholdAnalysis,
    topRiskCustomers,
    metadata: {
      generatedAt: new Date().toISOString(),
      dataSource: "MongoDB: customer_risk_classifications",
      basedOn: "risk_category_label from customer data",
    },
  };
}
