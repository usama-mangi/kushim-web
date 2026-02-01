import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format a date to a human-readable string
 */
export function formatDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(d);
}

/**
 * Format a date to relative time (e.g., "2 hours ago")
 */
export function formatRelativeTime(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - d.getTime()) / 1000);

  if (diffInSeconds < 60) return "just now";
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
  return formatDate(d);
}

/**
 * Format a number as a percentage
 */
export function formatPercentage(value: number, decimals: number = 1): string {
  return `${(value * 100).toFixed(decimals)}%`;
}

/**
 * Format a large number with commas
 */
export function formatNumber(value: number): string {
  return new Intl.NumberFormat("en-US").format(value);
}

/**
 * Get color class based on compliance status
 */
export function getStatusColor(status: "PASS" | "FAIL" | "WARNING" | "PENDING"): string {
  switch (status) {
    case "PASS":
      return "text-success";
    case "FAIL":
      return "text-error";
    case "WARNING":
      return "text-warning";
    case "PENDING":
      return "text-muted-foreground";
    default:
      return "text-muted-foreground";
  }
}

/**
 * Get background color class based on compliance status
 */
export function getStatusBgColor(status: "PASS" | "FAIL" | "WARNING" | "PENDING"): string {
  switch (status) {
    case "PASS":
      return "bg-success/10 text-success";
    case "FAIL":
      return "bg-error/10 text-error";
    case "WARNING":
      return "bg-warning/10 text-warning";
    case "PENDING":
      return "bg-muted text-muted-foreground";
    default:
      return "bg-muted text-muted-foreground";
  }
}

/**
 * Get health score color based on percentage
 */
export function getHealthScoreColor(score: number): string {
  if (score >= 0.9) return "text-success";
  if (score >= 0.7) return "text-warning";
  return "text-error";
}

/**
 * Truncate text to a maximum length
 */
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + "...";
}
