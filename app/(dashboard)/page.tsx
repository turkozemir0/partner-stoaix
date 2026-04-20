"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { KPICard } from "@/components/dashboard/KPICard"
import { EarningsChart } from "@/components/dashboard/EarningsChart"
import { RecentSales } from "@/components/dashboard/RecentSales"
import { TierCard } from "@/components/dashboard/TierCard"
import { DollarSign, Users, MousePointerClick, TrendingUp } from "lucide-react"
import { formatCurrency } from "@/lib/utils"
import type { Partner, Conversion } from "@/lib/types"

export default function DashboardPage() {
  const [partner, setPartner] = useState<Partner | null>(null)
  const [conversions, setConversions] = useState<Conversion[]>([])
  const [chartData, setChartData] = useState<{ month: string; earnings: number }[]>([])
  const [totalClicks, setTotalClicks] = useState(0)
  const [conversionRate, setConversionRate] = useState(0)
  const supabase = createClient()

  useEffect(() => {
    async function fetchData() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: partnerData } = await supabase
        .from("partners")
        .select("*")
        .eq("user_id", user.id)
        .single()
      if (partnerData) setPartner(partnerData)

      const { data: convData } = await supabase
        .from("conversions")
        .select("*")
        .eq("partner_id", partnerData?.id)
        .order("created_at", { ascending: false })
        .limit(5)
      if (convData) setConversions(convData)

      const { data: commissions } = await supabase
        .from("monthly_commissions")
        .select("period, commission_amount")
        .eq("partner_id", partnerData?.id)
        .order("period", { ascending: true })
        .limit(12)
      if (commissions) {
        setChartData(commissions.map((c: any) => ({
          month: new Date(c.period).toLocaleDateString("en-US", { month: "short" }),
          earnings: Number(c.commission_amount),
        })))
      }

      const { data: links } = await supabase
        .from("referral_links")
        .select("click_count, conversion_count")
        .eq("partner_id", partnerData?.id)
      if (links) {
        const clicks = links.reduce((sum: number, l: any) => sum + l.click_count, 0)
        const convs = links.reduce((sum: number, l: any) => sum + l.conversion_count, 0)
        setTotalClicks(clicks)
        setConversionRate(clicks > 0 ? (convs / clicks) * 100 : 0)
      }
    }
    fetchData()
  }, [])

  if (!partner) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold font-heading">Dashboard</h1>
        <p className="text-muted-foreground text-sm">Welcome back, {partner.full_name}</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Total Earnings"
          value={formatCurrency(partner.total_earnings)}
          icon={DollarSign}
          trend={{ value: 12, positive: true }}
        />
        <KPICard
          title="Active Clients"
          value={String(partner.active_clients)}
          icon={Users}
          description={`${partner.tier} tier`}
        />
        <KPICard
          title="Total Clicks"
          value={totalClicks.toLocaleString()}
          icon={MousePointerClick}
        />
        <KPICard
          title="Conversion Rate"
          value={`${conversionRate.toFixed(1)}%`}
          icon={TrendingUp}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <EarningsChart data={chartData} />
        </div>
        <TierCard currentTier={partner.tier} activeClients={partner.active_clients} />
      </div>

      <RecentSales conversions={conversions} />
    </div>
  )
}
