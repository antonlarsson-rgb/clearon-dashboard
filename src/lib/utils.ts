import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatNumber(n: number): string {
  return n.toLocaleString("sv-SE");
}

export function formatCurrency(n: number): string {
  if (n >= 1_000_000) {
    return `${(n / 1_000_000).toFixed(1).replace(".", ",")}M kr`;
  }
  return `${formatNumber(n)} kr`;
}

export function formatPercent(n: number): string {
  return `${n.toFixed(1).replace(".", ",")} %`;
}

export function scoreColor(score: number): string {
  if (score >= 70) return "score-high";
  if (score >= 40) return "score-medium";
  return "score-low";
}

export function scoreBgColor(score: number): string {
  if (score >= 70) return "bg-accent-subtle text-accent";
  if (score >= 40) return "bg-amber-50 text-score-medium";
  return "bg-gray-100 text-score-low";
}

export function timeAgo(date: Date | string): string {
  const now = new Date();
  const d = typeof date === "string" ? new Date(date) : date;
  const diffMs = now.getTime() - d.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMin < 1) return "just nu";
  if (diffMin < 60) return `${diffMin} min sedan`;
  if (diffHours < 24) return `${diffHours}h sedan`;
  if (diffDays === 1) return "igar";
  if (diffDays < 7) return `${diffDays} dagar sedan`;
  return d.toLocaleDateString("sv-SE");
}
