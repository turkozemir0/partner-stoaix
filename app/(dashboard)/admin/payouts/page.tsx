"use client"

import { useEffect, useState } from "react"
import { formatCurrency, formatDate } from "@/lib/utils"

interface PayoutRow {
  id: string
  amount: number
  method: string
  status: string
  reference: string | null
  requested_at: string
  processed_at: string | null
  partners: { full_name: string; email: string } | null
}

export default function AdminPayoutsPage() {
  const [payouts, setPayouts] = useState<PayoutRow[]>([])
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState<string | null>(null)

  useEffect(() => {
    fetchPayouts()
  }, [])

  async function fetchPayouts() {
    const res = await fetch("/api/admin/payouts")
    if (res.ok) {
      const data = await res.json()
      setPayouts(data.payouts)
    }
    setLoading(false)
  }

  async function handleAction(payoutId: string, action: "approve" | "reject") {
    setProcessing(payoutId)
    let reference = ""
    if (action === "approve") {
      reference = prompt("Enter payment reference (optional):") || ""
    }
    await fetch("/api/admin/payouts", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ payout_id: payoutId, action, reference }),
    })
    setProcessing(null)
    fetchPayouts()
  }

  if (loading) {
    return <div className="flex items-center justify-center h-64"><p className="text-muted-foreground">Loading...</p></div>
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Payout Management</h1>

      <div className="bg-white rounded-xl border overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="border-b bg-gray-50">
            <tr>
              <th className="text-left px-4 py-3 font-medium">Partner</th>
              <th className="text-left px-4 py-3 font-medium">Amount</th>
              <th className="text-left px-4 py-3 font-medium">Method</th>
              <th className="text-left px-4 py-3 font-medium">Status</th>
              <th className="text-left px-4 py-3 font-medium">Requested</th>
              <th className="text-left px-4 py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {payouts.map((p) => (
              <tr key={p.id} className="border-b last:border-0 hover:bg-gray-50">
                <td className="px-4 py-3">
                  <div className="font-medium">{p.partners?.full_name || "Unknown"}</div>
                  <div className="text-xs text-muted-foreground">{p.partners?.email}</div>
                </td>
                <td className="px-4 py-3 font-semibold">{formatCurrency(p.amount)}</td>
                <td className="px-4 py-3">{p.method?.replace("_", " ")}</td>
                <td className="px-4 py-3">
                  <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${
                    p.status === "completed" ? "bg-green-100 text-green-700" :
                    p.status === "pending" ? "bg-yellow-100 text-yellow-700" :
                    p.status === "processing" ? "bg-blue-100 text-blue-700" :
                    "bg-red-100 text-red-700"
                  }`}>
                    {p.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-muted-foreground">{formatDate(p.requested_at)}</td>
                <td className="px-4 py-3">
                  {p.status === "pending" && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleAction(p.id, "approve")}
                        disabled={processing === p.id}
                        className="px-3 py-1 bg-green-600 text-white text-xs font-medium rounded hover:bg-green-700 disabled:opacity-50"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => handleAction(p.id, "reject")}
                        disabled={processing === p.id}
                        className="px-3 py-1 bg-red-600 text-white text-xs font-medium rounded hover:bg-red-700 disabled:opacity-50"
                      >
                        Reject
                      </button>
                    </div>
                  )}
                  {p.status !== "pending" && p.reference && (
                    <span className="text-xs text-muted-foreground">Ref: {p.reference}</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
