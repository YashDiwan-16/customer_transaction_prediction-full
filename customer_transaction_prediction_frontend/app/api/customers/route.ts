import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { Customer, DashboardStats, RiskDistribution } from "@/lib/types";
import { Collection, Document } from "mongodb";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const risk = searchParams.get("risk") || "All";
    const search = searchParams.get("search") || "";
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const skip = (page - 1) * limit;

    const client = await clientPromise;
    const db = client.db("customer_transaction");
    const collection = db.collection("customer_risk_classifications");

    // Build filter for risk level and search
    const filter: Record<string, unknown> = {};
    if (risk !== "All") {
      filter.risk_category_label = risk;
    }
    if (search) {
      filter.customer_id = { $regex: search, $options: "i" };
    }

    // Get paginated customers
    const customers = (await collection
      .find(filter)
      .sort({ "% Past Due > 30 Days_mean": -1 })
      .skip(skip)
      .limit(limit)
      .toArray()) as unknown as Customer[];

    // Get total count for pagination
    const totalCustomers = await collection.countDocuments(filter);

    // Get dashboard stats
    const stats = await getDashboardStats(collection);
    // multiply by 100 to get percentage
    customers.forEach((customer) => {
      customer["% Past Due > 30 Days_mean"] *= 100;
      customer["% Past Due_mean"] *= 100;
    });
    // Format the stats
    // stats.highRiskPercentage = Math.round(stats.highRiskPercentage * 100) / 100;
    // stats.averagePastDue = Math.round(stats.averagePastDue * 100) / 100;
    // stats.totalInvoiceAmount = Math.round(stats.totalInvoiceAmount * 100) / 100;
    // stats.riskDistribution.forEach((risk) => {
    //   risk.count = Math.round((risk.count / totalCustomers) * 10000) / 100;
    // });
    // stats.riskDistribution.sort((a, b) => b.count - a.count);

    return NextResponse.json({
      customers,
      pagination: {
        total: totalCustomers,
        page,
        limit,
        pages: Math.ceil(totalCustomers / limit),
      },
      stats,
    });
  } catch (error) {
    console.error("API Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch customers" },
      { status: 500 }
    );
  }
}

async function getDashboardStats(
  collection: Collection<Document>
): Promise<DashboardStats> {
  // Get risk distribution
  const riskAggregation = (await collection
    .aggregate([
      {
        $group: {
          _id: "$risk_category_label",
          count: { $sum: 1 },
        },
      },
      {
        $project: {
          risk: "$_id",
          count: 1,
          _id: 0,
        },
      },
    ])
    .toArray()) as RiskDistribution[];

  // Get total customers
  const totalCustomers = await collection.countDocuments();

  // Get high risk percentage
  const highRiskCount =
    riskAggregation.find((r) => r.risk === "High Risk")?.count || 0;
  const highRiskPercentage = (highRiskCount / totalCustomers) * 100;

  // Get average past due percentage
  const pastDueAggregate = await collection
    .aggregate([
      {
        $group: {
          _id: null,
          averagePastDue: { $avg: { $toDouble: "$% Past Due_mean" } },
          totalInvoiceAmount: {
            $sum: { $toDouble: "$invoice_net_budget_rate_amount_sum" },
          },
        },
      },
    ])
    .toArray();

  const averagePastDue = pastDueAggregate[0]?.averagePastDue || 0;
  const totalInvoiceAmount = pastDueAggregate[0]?.totalInvoiceAmount || 0;

  return {
    totalCustomers,
    highRiskPercentage,
    averagePastDue,
    totalInvoiceAmount,
    riskDistribution: riskAggregation,
  };
}
