import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatPercentage(percentage: number): string {
  return `${percentage.toFixed(1)}%`;
}

export function getRiskColor(risk: string): string {
  switch (risk) {
    case "High Risk":
      return "text-red-500 dark:text-red-400";
    case "Medium Risk":
      return "text-amber-500 dark:text-amber-400";
    case "Low Risk":
      return "text-green-500 dark:text-green-400";
    default:
      return "text-blue-500 dark:text-blue-400";
  }
}

export function getRiskBgColor(risk: string): string {
  switch (risk) {
    case "High Risk":
      return "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300";
    case "Medium Risk":
      return "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300";
    case "Low Risk":
      return "bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300";
    default:
      return "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300";
  }
}
