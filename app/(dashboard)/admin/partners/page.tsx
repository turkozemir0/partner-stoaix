"use client"

import { useEffect, useState } from "react"
import { formatCurrency } from "@/lib/utils"
import { useTranslation } from "@/lib/i18n/useTranslation"
import type { Partner } from "@/lib/types"

export default function AdminPartnersPage() {
  const { t } = useTranslation()
  const [partners, setPartners] = useState<Partner[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchPartners()
  }, [])

  async function fetchPartners() {
    const res = await fetch("/api/admin/partners")
    if (res.ok) {
      const data = await res.json()
      setPartners(data.partners)
    }
    setLoading(false)
  }

  async function updatePartner(partnerId: string, field: string, value: string) {
    await fetch("/api/admin/partners", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ partner_id: partnerId, [field]: value }),
    })
    fetchPartners()
  }

  if (loading) {
    return <div className="flex items-center justify-center h-64"><p className="text-muted-foreground">{t("common.loading")}</p></div>
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">{t("admin.partners.title")}</h1>

      <div className="bg-white rounded-xl border overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="border-b bg-gray-50">
            <tr>
              <th className="text-left px-4 py-3 font-medium">{t("admin.partners.name")}</th>
              <th className="text-left px-4 py-3 font-medium">{t("admin.partners.email")}</th>
              <th className="text-left px-4 py-3 font-medium">{t("admin.partners.phone")}</th>
              <th className="text-left px-4 py-3 font-medium">{t("admin.partners.tier")}</th>
              <th className="text-left px-4 py-3 font-medium">{t("admin.partners.activeClients")}</th>
              <th className="text-left px-4 py-3 font-medium">{t("admin.partners.totalEarnings")}</th>
              <th className="text-left px-4 py-3 font-medium">{t("admin.partners.status")}</th>
            </tr>
          </thead>
          <tbody>
            {partners.map((p) => (
              <tr key={p.id} className="border-b last:border-0 hover:bg-gray-50">
                <td className="px-4 py-3 font-medium">{p.full_name}</td>
                <td className="px-4 py-3 text-muted-foreground">{p.email}</td>
                <td className="px-4 py-3 text-muted-foreground">{p.phone || "—"}</td>
                <td className="px-4 py-3">
                  <select
                    value={p.tier}
                    onChange={(e) => updatePartner(p.id, "tier", e.target.value)}
                    className="border rounded px-2 py-1 text-sm"
                  >
                    <option value="starter">Starter</option>
                    <option value="growth">Growth</option>
                    <option value="pro">Pro</option>
                  </select>
                </td>
                <td className="px-4 py-3">{p.active_clients}</td>
                <td className="px-4 py-3">{formatCurrency(p.total_earnings)}</td>
                <td className="px-4 py-3">
                  <select
                    value={p.status}
                    onChange={(e) => updatePartner(p.id, "status", e.target.value)}
                    className="border rounded px-2 py-1 text-sm"
                  >
                    <option value="active">Active</option>
                    <option value="suspended">Suspended</option>
                    <option value="pending">Pending</option>
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
