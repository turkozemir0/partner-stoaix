"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { KPICard } from "@/components/dashboard/KPICard"
import { formatCurrency, formatDate } from "@/lib/utils"
import { DollarSign, Clock, CheckCircle } from "lucide-react"
import type { Partner, MonthlyCommission } from "@/lib/types"

export default function EarningsPage() {
  const [partner, setPartner] = useState<Partner | null>(null)
  const [commissions, setCommissions] = useState<MonthlyCommission[]>([])
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

      const { data: commData } = await supabase
        .from("monthly_commissions")
        .select("*")
        .eq("partner_id", partnerData?.id)
        .order("period", { ascending: false })
      if (commData) setCommissions(commData)
    }
    fetchData()
  }, [])

  const statusVariant = (status: string) => {
    switch (status) {
      case "paid": return "success"
      case "confirmed": return "default"
      case "calculated": return "warning"
      default: return "secondary"
    }
  }

  if (!partner) {
    return <div className="flex items-center justify-center h-64 text-muted-foreground">Loading...</div>
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold font-heading">Earnings</h1>
        <p className="text-muted-foreground text-sm">Your commission history and breakdown</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <KPICard
          title="Total Earned"
          value={formatCurrency(partner.total_earnings)}
          icon={DollarSign}
        />
        <KPICard
          title="Pending Balance"
          value={formatCurrency(partner.pending_balance)}
          icon={Clock}
        />
        <KPICard
          title="Paid Out"
          value={formatCurrency(partner.paid_balance)}
          icon={CheckCircle}
        />
      </div>

      {/* Commission History */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Commission History</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Period</TableHead>
                <TableHead>Tier</TableHead>
                <TableHead>Rate</TableHead>
                <TableHead>Active Clients</TableHead>
                <TableHead>Revenue</TableHead>
                <TableHead>Commission</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {commissions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    No commission history yet.
                  </TableCell>
                </TableRow>
              ) : (
                commissions.map((comm) => (
                  <TableRow key={comm.id}>
                    <TableCell className="font-medium">
                      {new Date(comm.period).toLocaleDateString("en-US", { year: "numeric", month: "long" })}
                    </TableCell>
                    <TableCell className="capitalize">{comm.tier_at_time}</TableCell>
                    <TableCell>{(Number(comm.rate_at_time) * 100).toFixed(0)}%</TableCell>
                    <TableCell>{comm.active_clients_count}</TableCell>
                    <TableCell>{formatCurrency(comm.total_revenue)}</TableCell>
                    <TableCell className="font-medium">{formatCurrency(comm.commission_amount)}</TableCell>
                    <TableCell>
                      <Badge variant={statusVariant(comm.status) as any}>{comm.status}</Badge>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
