"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import CustomerTable from "@/components/customer-table";
import { Skeleton } from "@/components/ui/skeleton";
import { Customer } from "@/lib/types";

export default function CustomersPage() {
  const searchParams = useSearchParams();
  const risk = searchParams.get("risk") || "All";
  const search = searchParams.get("search") || "";
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "10");

  const [loading, setLoading] = useState(true);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 10,
    pages: 1,
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const params = new URLSearchParams();
        params.set("risk", risk);
        if (search) params.set("search", search);
        params.set("page", page.toString());
        params.set("limit", limit.toString());

        const response = await fetch(`/api/customers?${params.toString()}`);
        const data = await response.json();

        setCustomers(data.customers);
        setPagination(data.pagination);
      } catch (error) {
        console.error("Failed to load customers data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [risk, search, page, limit]);

  return (
    <div className="container mx-auto p-4 space-y-4">
      <div className="flex flex-col space-y-2 md:flex-row md:items-center md:justify-between md:space-y-0 px-2">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Customers</h2>
          <p className="text-muted-foreground">
            View and filter customer risk levels
          </p>
        </div>
      </div>

      <Suspense fallback={<CustomerTableSkeleton />}>
        {loading ? (
          <CustomerTableSkeleton />
        ) : (
          <CustomerTable customers={customers} pagination={pagination} />
        )}
      </Suspense>
    </div>
  );
}

function CustomerTableSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex justify-between">
        <Skeleton className="h-10 w-36" />
        <Skeleton className="h-10 w-72" />
      </div>

      <div className="rounded-md border">
        <div className="h-10 border-b px-4 flex items-center">
          <Skeleton className="h-4 w-1/5" />
          <Skeleton className="h-4 w-1/5 ml-auto" />
        </div>

        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-16 border-b px-4 flex items-center">
            <Skeleton className="h-4 w-1/6" />
            <Skeleton className="h-4 w-20 ml-8" />
            <Skeleton className="h-4 w-24 ml-auto" />
            <Skeleton className="h-4 w-16 ml-8" />
            <Skeleton className="h-4 w-16 ml-8" />
          </div>
        ))}
      </div>

      <div className="flex justify-center">
        <Skeleton className="h-8 w-64" />
      </div>
    </div>
  );
}
