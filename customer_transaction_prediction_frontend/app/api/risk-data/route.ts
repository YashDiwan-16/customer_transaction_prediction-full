import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { Customer } from "@/lib/types";

export async function GET() {
  try {
    const client = await clientPromise;
    const db = client.db();
    const collection = db.collection("customer_risk_classifications");

    // Get all customers
    const customers = (await collection
      .find({})
      .toArray()) as unknown as Customer[];

    // Aggregate past due data
    const pastDueData = await collection
      .aggregate([
        {
          $group: {
            _id: "$risk_category_label",
            pastDue30: { $avg: { $toDouble: "$% Past Due > 30 Days_mean" } },
            totalPastDue: { $avg: { $toDouble: "$% Past Due_mean" } },
            invoiceAmount: {
              $sum: { $toDouble: "$invoice_net_budget_rate_amount_sum" },
            },
            count: { $sum: 1 },
          },
        },
        {
          $sort: { _id: 1 },
        },
      ])
      .toArray();

    // Calculate risk threshold distributions
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
        mediumRisk,
        highRisk,
        total: customers.length,
      };
    });

    // Get top high risk customers
    const highRiskCustomers = customers
      .filter((c) => c.risk_category_label === "High Risk")
      .sort(
        (a, b) =>
          b["% Past Due > 30 Days_mean"] - a["% Past Due > 30 Days_mean"]
      )
      .slice(0, 10);

    return NextResponse.json({
      pastDueData,
      thresholdAnalysis,
      highRiskCustomers,
    });
  } catch (error) {
    console.error("API Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch risk data" },
      { status: 500 }
    );
  }
}
