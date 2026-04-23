"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent } from "@/components/ui/card"
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { formatCurrency, formatDate } from "@/lib/utils"
import { useTranslation } from "@/lib/i18n/useTranslation"
import type { Conversion } from "@/lib/types"

export default function SalesPage() {
  const { t } = useTranslation()
  const [conversions, setConversions] = useState<Conversion[]>([])
  const [filter, setFilter] = useState<"all" | "active" | "trial" | "churned" | "cancelled">("all")
  const supabase = createClient()

  useEffect(() => {
    async function fetchSales() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: partner } = await supabase
        .from("partners")
        .select("id")
        .eq("user_id", user.id)
        .single()
      if (!partner) return

      let query = supabase
        .from("conversions")
        .select("*")
        .eq("partner_id", partner.id)
        .order("created_at", { ascending: false })

      if (filter !== "all") {
        query = query.eq("status", filter)
      }

      const { data } = await query
      if (data) setConversions(data)
    }
    fetchSales()
  }, [filter])

  const statusVariant = (status: string) => {
    switch (status) {
      case "active": return "success"
      case "trial": return "outline"
      case "churned": return "destructive"
      case "cancelled": return "warning"
      default: return "secondary"
    }
  }

  const filterLabels: Record<string, string> = {
    all: t("sales.all"),
    active: t("sales.active"),
    trial: t("sales.trial"),
    churned: t("sales.churned"),
    cancelled: t("sales.cancelled"),
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold font-heading">{t("sales.title")}</h1>
        <p className="text-muted-foreground text-sm">{t("sales.subtitle")}</p>
      </div>

      <div className="flex gap-2">
        {(["all", "active", "trial", "churned", "cancelled"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
              filter === f
                ? "bg-primary text-white"
                : "bg-gray-100 text-muted-foreground hover:bg-gray-200"
            }`}
          >
            {filterLabels[f]}
          </button>
        ))}
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("sales.organization")}</TableHead>
                <TableHead>{t("sales.plan")}</TableHead>
                <TableHead>{t("sales.monthlyPrice")}</TableHead>
                <TableHead>{t("sales.status")}</TableHead>
                <TableHead>{t("sales.started")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {conversions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    {t("sales.noSales")}
                  </TableCell>
                </TableRow>
              ) : (
                conversions.map((conv) => (
                  <TableRow key={conv.id}>
                    <TableCell className="font-medium">{conv.organization_name}</TableCell>
                    <TableCell>{conv.plan_type}</TableCell>
                    <TableCell>{formatCurrency(conv.monthly_price)}</TableCell>
                    <TableCell>
                      <Badge variant={statusVariant(conv.status) as any}>{conv.status}</Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{formatDate(conv.started_at)}</TableCell>
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
