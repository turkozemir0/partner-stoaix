"use client"

import { useEffect, useState } from "react"
import { formatCurrency } from "@/lib/utils"
import { Users, Building2, DollarSign, CreditCard, TrendingUp } from "lucide-react"
import { useTranslation } from "@/lib/i18n/useTranslation"

interface AdminStats {
  totalPartners: number
  totalActiveClients: number
  totalRevenue: number
  totalCommissions: number
  pendingPayouts: number
  recentPayouts: Array<{
    id: string
    amount: number
    status: string
    requested_at: string
    partners?: { full_name: string }
  }>
}

export default function AdminDashboard() {
  const { t } = useTranslation()
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchStats() {
      const res = await fetch("/api/admin/stats")
      if (res.ok) {
        const data = await res.json()
        setStats(data)
      }
      setLoading(false)
    }
    fetchStats()
  }, [])

  if (loading) {
    return <div className="flex items-center justify-center h-64"><p className="text-muted-foreground">{t("common.loading")}</p></div>
  }

  if (!stats) {
    return <div className="flex items-center justify-center h-64"><p className="text-red-500">{t("common.accessDenied")}</p></div>
  }

  const kpis = [
    { labelKey: "admin.overview.totalPartners", value: stats.totalPartners, icon: Users, format: "number" },
    { labelKey: "admin.overview.activeClients", value: stats.totalActiveClients, icon: Building2, format: "number" },
    { labelKey: "admin.overview.monthlyRevenue", value: stats.totalRevenue, icon: TrendingUp, format: "currency" },
    { labelKey: "admin.overview.totalCommissions", value: stats.totalCommissions, icon: DollarSign, format: "currency" },
    { labelKey: "admin.overview.pendingPayouts", value: stats.pendingPayouts, icon: CreditCard, format: "currency" },
  ]

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">{t("admin.overview.title")}</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {kpis.map((kpi) => (
          <div key={kpi.labelKey} className="bg-white rounded-xl border p-4">
            <div className="flex items-center gap-2 mb-2">
              <kpi.icon className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">{t(kpi.labelKey)}</span>
            </div>
            <p className="text-2xl font-bold">
              {kpi.format === "currency" ? formatCurrency(kpi.value) : kpi.value}
            </p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl border p-6">
        <h2 className="text-lg font-semibold mb-4">{t("admin.overview.recentPendingPayouts")}</h2>
        {stats.recentPayouts.length === 0 ? (
          <p className="text-muted-foreground text-sm">{t("admin.overview.noPendingPayouts")}</p>
        ) : (
          <div className="space-y-3">
            {stats.recentPayouts.map((payout) => (
              <div key={payout.id} className="flex items-center justify-between py-2 border-b last:border-0">
                <span className="text-sm font-medium">{payout.partners?.full_name || "Unknown"}</span>
                <span className="text-sm font-semibold">{formatCurrency(payout.amount)}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
