"use client"

import { useEffect, useState } from "react"
import { formatCurrency, formatDate } from "@/lib/utils"
import { useTranslation } from "@/lib/i18n/useTranslation"
import type { Partner } from "@/lib/types"

interface ConversionRow {
  id: string
  organization_name: string
  plan_type: string
  monthly_price: number
  status: string
  started_at: string
  partners: { full_name: string } | null
}

export default function AdminConversionsPage() {
  const { t } = useTranslation()
  const [conversions, setConversions] = useState<ConversionRow[]>([])
  const [partners, setPartners] = useState<Partner[]>([])
  const [loading, setLoading] = useState(true)
  const [showDialog, setShowDialog] = useState(false)
  const [form, setForm] = useState({
    partner_id: "",
    organization_name: "",
    organization_id: "",
    plan_type: "",
    monthly_price: "",
  })

  useEffect(() => {
    fetchData()
  }, [])

  async function fetchData() {
    const [convRes, partnerRes] = await Promise.all([
      fetch("/api/admin/conversions"),
      fetch("/api/admin/partners"),
    ])
    if (convRes.ok) {
      const data = await convRes.json()
      setConversions(data.conversions)
    }
    if (partnerRes.ok) {
      const data = await partnerRes.json()
      setPartners(data.partners)
    }
    setLoading(false)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const res = await fetch("/api/admin/conversions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        monthly_price: parseFloat(form.monthly_price),
      }),
    })
    if (res.ok) {
      setShowDialog(false)
      setForm({ partner_id: "", organization_name: "", organization_id: "", plan_type: "", monthly_price: "" })
      fetchData()
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center h-64"><p className="text-muted-foreground">{t("common.loading")}</p></div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{t("admin.conversions.title")}</h1>
        <button
          onClick={() => setShowDialog(true)}
          className="px-4 py-2 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary/90 transition-colors"
        >
          {t("admin.conversions.addConversion")}
        </button>
      </div>

      <div className="bg-white rounded-xl border overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="border-b bg-gray-50">
            <tr>
              <th className="text-left px-4 py-3 font-medium">{t("admin.conversions.organization")}</th>
              <th className="text-left px-4 py-3 font-medium">{t("admin.conversions.partner")}</th>
              <th className="text-left px-4 py-3 font-medium">{t("admin.conversions.plan")}</th>
              <th className="text-left px-4 py-3 font-medium">{t("admin.conversions.monthlyPrice")}</th>
              <th className="text-left px-4 py-3 font-medium">{t("admin.conversions.status")}</th>
              <th className="text-left px-4 py-3 font-medium">{t("admin.conversions.started")}</th>
            </tr>
          </thead>
          <tbody>
            {conversions.map((c) => (
              <tr key={c.id} className="border-b last:border-0 hover:bg-gray-50">
                <td className="px-4 py-3 font-medium">{c.organization_name}</td>
                <td className="px-4 py-3 text-muted-foreground">{c.partners?.full_name || "—"}</td>
                <td className="px-4 py-3">{c.plan_type}</td>
                <td className="px-4 py-3">{formatCurrency(c.monthly_price)}</td>
                <td className="px-4 py-3">
                  <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${
                    c.status === "active" ? "bg-green-100 text-green-700" :
                    c.status === "trial" ? "bg-yellow-100 text-yellow-700" :
                    c.status === "churned" ? "bg-red-100 text-red-700" :
                    "bg-gray-100 text-gray-700"
                  }`}>
                    {c.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-muted-foreground">{formatDate(c.started_at)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4">
            <h2 className="text-lg font-semibold mb-4">{t("admin.conversions.dialogTitle")}</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">{t("admin.conversions.partnerField")}</label>
                <select
                  value={form.partner_id}
                  onChange={(e) => setForm({ ...form, partner_id: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2 text-sm"
                  required
                >
                  <option value="">{t("admin.conversions.selectPartner")}</option>
                  {partners.map((p) => (
                    <option key={p.id} value={p.id}>{p.full_name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">{t("admin.conversions.orgName")}</label>
                <input
                  type="text"
                  value={form.organization_name}
                  onChange={(e) => setForm({ ...form, organization_name: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2 text-sm"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">{t("admin.conversions.orgId")}</label>
                <input
                  type="text"
                  value={form.organization_id}
                  onChange={(e) => setForm({ ...form, organization_id: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">{t("admin.conversions.planType")}</label>
                <input
                  type="text"
                  value={form.plan_type}
                  onChange={(e) => setForm({ ...form, plan_type: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2 text-sm"
                  placeholder={t("admin.conversions.planPlaceholder")}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">{t("admin.conversions.monthlyPriceField")}</label>
                <input
                  type="number"
                  step="0.01"
                  value={form.monthly_price}
                  onChange={(e) => setForm({ ...form, monthly_price: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2 text-sm"
                  required
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowDialog(false)}
                  className="flex-1 px-4 py-2 border rounded-lg text-sm font-medium hover:bg-gray-50"
                >
                  {t("admin.conversions.cancel")}
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary/90"
                >
                  {t("admin.conversions.add")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
