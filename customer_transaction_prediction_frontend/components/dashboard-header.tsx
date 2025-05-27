import { DashboardStats } from "@/lib/types";
import ToggleButton from "./toggle-button";

interface DashboardHeaderProps {
  stats?: DashboardStats;
}

export function DashboardHeader({ stats }: DashboardHeaderProps) {
  return (
    <div className="flex flex-col space-y-2 md:flex-row md:items-center md:justify-between md:space-y-0 px-6 py-4">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">
          Customer Risk Dashboard
        </h2>
        <p className="text-muted-foreground">
          Monitor and manage customer risk levels across{" "}
          {stats?.totalCustomers.toLocaleString()} customers
        </p>
      </div>
      <ToggleButton />
    </div>
  );
}
