export type PartnerTier = "starter" | "growth" | "pro"
export type PartnerStatus = "active" | "suspended" | "pending"
export type ConversionStatus = "active" | "churned" | "cancelled"
export type CommissionStatus = "calculated" | "confirmed" | "paid"
export type PayoutMethod = "bank_transfer" | "paypal"
export type PayoutStatus = "pending" | "processing" | "completed" | "failed"

export interface Partner {
  id: string
  user_id: string
  email: string
  full_name: string
  phone: string
  company_name: string | null
  is_admin: boolean
  tier: PartnerTier
  active_clients: number
  status: PartnerStatus
  total_earnings: number
  pending_balance: number
  paid_balance: number
  created_at: string
  updated_at: string
}

export interface ReferralLink {
  id: string
  partner_id: string
  code: string
  label: string
  destination_url: string
  is_active: boolean
  click_count: number
  conversion_count: number
  created_at: string
}

export interface Click {
  id: string
  link_id: string
  ip_hash: string
  user_agent: string
  referrer: string
  country: string
  created_at: string
}

export interface Conversion {
  id: string
  partner_id: string
  link_id: string
  organization_id: string
  organization_name: string
  plan_type: string
  monthly_price: number
  status: ConversionStatus
  started_at: string
  churned_at: string | null
  created_at: string
}

export interface MonthlyCommission {
  id: string
  partner_id: string
  period: string
  tier_at_time: PartnerTier
  rate_at_time: number
  active_clients_count: number
  total_revenue: number
  commission_amount: number
  status: CommissionStatus
  created_at: string
}

export interface Payout {
  id: string
  partner_id: string
  amount: number
  method: PayoutMethod
  status: PayoutStatus
  reference: string
  requested_at: string
  processed_at: string | null
}

export interface Notification {
  id: string
  partner_id: string
  type: string
  title: string
  message: string
  is_read: boolean
  created_at: string
}

export interface Payment {
  id: string
  conversion_id: string
  organization_id: string
  stripe_invoice_id: string
  amount: number
  currency: string
  period_start: string
  period_end: string
  paid_at: string
  created_at: string
}

export interface DashboardStats {
  totalEarnings: number
  pendingBalance: number
  activeClients: number
  conversionRate: number
  tier: PartnerTier
  monthlyCommission: number
}
