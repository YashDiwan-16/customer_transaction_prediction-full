"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, ChevronRight, Search } from "lucide-react";
import { Customer, RiskLevel } from "@/lib/types";
import { formatCurrency, formatPercentage, getRiskBgColor } from "@/lib/utils";
import { useNoDataCheck } from "@/hooks/use-no-data-check";
import { NoDataAlert } from "./no-data-alert";

interface CustomerTableProps {
  customers: Customer[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}

export default function CustomerTable({
  customers,
  pagination,
}: CustomerTableProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const currentRisk = (searchParams.get("risk") as RiskLevel) || "All";
  const currentSearch = searchParams.get("search") || "";
  const currentPage = parseInt(searchParams.get("page") || "1");

  const [searchInput, setSearchInput] = useState(currentSearch);
  const { showNoDataAlert, closeAlert } = useNoDataCheck();

  // Handle risk filter change
  const handleRiskChange = (value: string) => {
    const params = new URLSearchParams(searchParams);
    params.set("risk", value);
    params.set("page", "1"); // Reset to page 1 when filter changes
    router.push(`?${params.toString()}`);
  };

  // Handle search
  const handleSearch = () => {
    const params = new URLSearchParams(searchParams);
    params.set("search", searchInput);
    params.set("page", "1"); // Reset to page 1 when search changes
    router.push(`?${params.toString()}`);
  };

  // Handle pagination
  const handlePageChange = (page: number) => {
    const params = new URLSearchParams(searchParams);
    params.set("page", page.toString());
    router.push(`?${params.toString()}`);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col space-y-2 md:flex-row md:items-center md:justify-between md:space-y-0">
        <NoDataAlert isOpen={showNoDataAlert} onClose={closeAlert} />

        <div className="flex items-center space-x-2">
          <Select value={currentRisk} onValueChange={handleRiskChange}>
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

          <div className="flex w-full max-w-sm items-center space-x-2">
            <Input
              type="text"
              placeholder="Search customer ID..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            />
            <Button type="submit" size="icon" onClick={handleSearch}>
              <Search className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage <= 1}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm">
            Page {currentPage} of {pagination.pages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage >= pagination.pages}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Customer ID</TableHead>
              <TableHead>Risk Level</TableHead>
              <TableHead className="text-right">Invoice Amount</TableHead>
              <TableHead className="text-right">
                Past Due {">"} 30 Days
              </TableHead>
              <TableHead className="text-right">Total Past Due</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {customers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8">
                  No customers found
                </TableCell>
              </TableRow>
            ) : (
              customers.map((customer) => (
                <TableRow key={customer._id}>
                  <TableCell className="font-medium">
                    {customer.customer_id}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={getRiskBgColor(customer.risk_category_label)}
                    >
                      {customer.risk_category_label}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(
                      customer.invoice_net_budget_rate_amount_sum
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatPercentage(customer["% Past Due > 30 Days_mean"])}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatPercentage(customer["% Past Due_mean"])}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <div className="text-sm text-muted-foreground text-center">
        Showing {customers.length} of {pagination.total} customers
      </div>
    </div>
  );
}
