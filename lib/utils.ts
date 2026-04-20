import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount)
}

export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(date))
}

export function getTier(activeClients: number): "starter" | "growth" | "pro" {
  if (activeClients >= 10) return "pro"
  if (activeClients >= 5) return "growth"
  return "starter"
}

export function getCommissionRate(tier: "starter" | "growth" | "pro"): number {
  switch (tier) {
    case "pro": return 0.30
    case "growth": return 0.20
    case "starter": return 0.10
  }
}

export function generateReferralCode(): string {
  return Math.random().toString(36).substring(2, 8)
}
