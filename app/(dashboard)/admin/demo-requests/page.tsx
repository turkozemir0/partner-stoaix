"use client"

import { useEffect, useState } from "react"
import { useTranslation } from "@/lib/i18n/useTranslation"
import { formatDate } from "@/lib/utils"

interface DemoRequestRow {
  id: string
  partner_id: string
  status: "pending" | "approved" | "rejected"
  admin_note: string | null
  created_at: string
  updated_at: string
  partners: {
    full_name: string
    email: string
    company_name: string | null
  }
}

export default function AdminDemoRequestsPage() {
  const { t } = useTranslation()
  const [requests, setRequests] = useState<DemoRequestRow[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [noteDialog, setNoteDialog] = useState<{ id: string; action: "approved" | "rejected" } | null>(null)
  const [adminNote, setAdminNote] = useState("")

  async function fetchRequests() {
    const res = await fetch("/api/admin/demo-requests")
    if (res.ok) {
      const data = await res.json()
      setRequests(data.requests || [])
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchRequests()
  }, [])

  async function handleAction(id: string, status: "approved" | "rejected", note?: string) {
    setActionLoading(id)
    await fetch("/api/admin/demo-requests", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status, admin_note: note || undefined }),
    })
    setNoteDialog(null)
    setAdminNote("")
    setActionLoading(null)
    fetchRequests()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-pulse text-muted-foreground">{t("common.loading")}</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold font-heading">{t("admin.demoRequests.title")}</h1>
        <p className="text-muted-foreground text-sm">{t("admin.demoRequests.subtitle")}</p>
      </div>

      <div className="bg-white rounded-xl border overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="border-b bg-gray-50">
            <tr>
              <th className="text-left px-4 py-3 font-medium">{t("admin.demoRequests.partner")}</th>
              <th className="text-left px-4 py-3 font-medium">{t("admin.demoRequests.email")}</th>
              <th className="text-left px-4 py-3 font-medium">{t("admin.demoRequests.company")}</th>
              <th className="text-left px-4 py-3 font-medium">{t("admin.demoRequests.date")}</th>
              <th className="text-left px-4 py-3 font-medium">{t("admin.demoRequests.status")}</th>
              <th className="text-left px-4 py-3 font-medium">{t("admin.demoRequests.actions")}</th>
            </tr>
          </thead>
          <tbody>
            {requests.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                  {t("admin.demoRequests.noRequests")}
                </td>
              </tr>
            ) : (
              requests.map((req) => (
                <tr key={req.id} className="border-b last:border-b-0">
                  <td className="px-4 py-3 font-medium">{req.partners.full_name}</td>
                  <td className="px-4 py-3 text-muted-foreground">{req.partners.email}</td>
                  <td className="px-4 py-3 text-muted-foreground">{req.partners.company_name || "-"}</td>
                  <td className="px-4 py-3 text-muted-foreground">{formatDate(req.created_at)}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${
                      req.status === "approved" ? "bg-green-100 text-green-700" :
                      req.status === "rejected" ? "bg-red-100 text-red-700" :
                      "bg-yellow-100 text-yellow-700"
                    }`}>
                      {t(`admin.demoRequests.statusLabels.${req.status}`)}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {req.status === "pending" ? (
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleAction(req.id, "approved")}
                          disabled={actionLoading === req.id}
                          className="px-3 py-1 text-xs font-medium text-white bg-green-600 rounded hover:bg-green-700 disabled:opacity-50"
                        >
                          {t("admin.demoRequests.approve")}
                        </button>
                        <button
                          onClick={() => setNoteDialog({ id: req.id, action: "rejected" })}
                          disabled={actionLoading === req.id}
                          className="px-3 py-1 text-xs font-medium text-white bg-red-600 rounded hover:bg-red-700 disabled:opacity-50"
                        >
                          {t("admin.demoRequests.reject")}
                        </button>
                      </div>
                    ) : (
                      req.admin_note && (
                        <span className="text-xs text-muted-foreground">{req.admin_note}</span>
                      )
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {noteDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold mb-4">{t("admin.demoRequests.rejectReason")}</h3>
            <textarea
              value={adminNote}
              onChange={(e) => setAdminNote(e.target.value)}
              placeholder={t("admin.demoRequests.notePlaceholder")}
              className="w-full border rounded-lg px-3 py-2 text-sm mb-4 h-24 resize-none"
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => { setNoteDialog(null); setAdminNote("") }}
                className="px-4 py-2 text-sm border rounded-lg hover:bg-gray-50"
              >
                {t("admin.demoRequests.cancel")}
              </button>
              <button
                onClick={() => handleAction(noteDialog.id, noteDialog.action, adminNote)}
                disabled={actionLoading === noteDialog.id}
                className="px-4 py-2 text-sm text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50"
              >
                {t("admin.demoRequests.confirmReject")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
