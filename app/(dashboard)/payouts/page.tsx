"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { formatCurrency, formatDate } from "@/lib/utils"
import { useTranslation } from "@/lib/i18n/useTranslation"
import type { Payout, Partner } from "@/lib/types"

const MIN_PAYOUT = 50

export default function PayoutsPage() {
  const { t } = useTranslation()
  const [partner, setPartner] = useState<Partner | null>(null)
  const [payouts, setPayouts] = useState<Payout[]>([])
  const [dialogOpen, setDialogOpen] = useState(false)
  const [amount, setAmount] = useState("")
  const [method, setMethod] = useState<"bank_transfer" | "paypal">("bank_transfer")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const supabase = createClient()

  useEffect(() => {
    fetchData()
  }, [])

  async function fetchData() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: partnerData } = await supabase
      .from("partners")
      .select("*")
      .eq("user_id", user.id)
      .single()
    if (partnerData) setPartner(partnerData)

    const { data: payoutData } = await supabase
      .from("payouts")
      .select("*")
      .eq("partner_id", partnerData?.id)
      .order("requested_at", { ascending: false })
    if (payoutData) setPayouts(payoutData)
  }

  async function requestPayout(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    setLoading(true)

    const payoutAmount = parseFloat(amount)
    if (isNaN(payoutAmount) || payoutAmount < MIN_PAYOUT) {
      setError(t("payouts.minError", { amount: formatCurrency(MIN_PAYOUT) }))
      setLoading(false)
      return
    }

    if (partner && payoutAmount > partner.pending_balance) {
      setError(t("payouts.exceedsBalance"))
      setLoading(false)
      return
    }

    const { error: insertError } = await supabase.from("payouts").insert({
      partner_id: partner!.id,
      amount: payoutAmount,
      method,
    })

    if (insertError) {
      setError("Failed to submit request")
      setLoading(false)
      return
    }

    await supabase
      .from("partners")
      .update({ pending_balance: (partner!.pending_balance - payoutAmount) })
      .eq("id", partner!.id)

    setDialogOpen(false)
    setAmount("")
    setLoading(false)
    fetchData()
  }

  const statusVariant = (status: string) => {
    switch (status) {
      case "completed": return "success"
      case "processing": return "default"
      case "pending": return "warning"
      case "failed": return "destructive"
      default: return "secondary"
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-heading">{t("payouts.title")}</h1>
          <p className="text-muted-foreground text-sm">{t("payouts.subtitle")}</p>
        </div>
        <div className="text-right">
          <p className="text-sm text-muted-foreground">{t("payouts.availableBalance")}</p>
          <p className="text-xl font-bold">{formatCurrency(partner?.pending_balance || 0)}</p>
        </div>
      </div>

      <Button
        onClick={() => setDialogOpen(true)}
        disabled={!partner || partner.pending_balance < MIN_PAYOUT}
      >
        {t("payouts.requestPayout")}
      </Button>
      {partner && partner.pending_balance < MIN_PAYOUT && (
        <p className="text-xs text-muted-foreground">
          {t("payouts.minPayout", { amount: formatCurrency(MIN_PAYOUT), needed: formatCurrency(MIN_PAYOUT - partner.pending_balance) })}
        </p>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t("payouts.payoutHistory")}</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("payouts.date")}</TableHead>
                <TableHead>{t("payouts.amount")}</TableHead>
                <TableHead>{t("payouts.method")}</TableHead>
                <TableHead>{t("payouts.status")}</TableHead>
                <TableHead>{t("payouts.reference")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {payouts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    {t("payouts.noPayouts")}
                  </TableCell>
                </TableRow>
              ) : (
                payouts.map((payout) => (
                  <TableRow key={payout.id}>
                    <TableCell>{formatDate(payout.requested_at)}</TableCell>
                    <TableCell className="font-medium">{formatCurrency(payout.amount)}</TableCell>
                    <TableCell className="capitalize">{payout.method.replace("_", " ")}</TableCell>
                    <TableCell>
                      <Badge variant={statusVariant(payout.status) as any}>{payout.status}</Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-xs">{payout.reference || "-"}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("payouts.dialogTitle")}</DialogTitle>
            <DialogDescription>
              {t("payouts.dialogDescription", { amount: formatCurrency(partner?.pending_balance || 0) })}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={requestPayout} className="space-y-4 mt-4">
            {error && (
              <div className="p-3 text-sm text-red-600 bg-red-50 rounded-lg">{error}</div>
            )}
            <div className="space-y-2">
              <label className="text-sm font-medium">{t("payouts.amountField")}</label>
              <Input
                type="number"
                min={MIN_PAYOUT}
                step="0.01"
                placeholder={t("payouts.amountPlaceholder", { min: MIN_PAYOUT })}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">{t("payouts.paymentMethod")}</label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setMethod("bank_transfer")}
                  className={`flex-1 p-3 rounded-lg border text-sm ${
                    method === "bank_transfer" ? "border-primary bg-primary/5" : "border-gray-200"
                  }`}
                >
                  {t("payouts.bankTransfer")}
                </button>
                <button
                  type="button"
                  onClick={() => setMethod("paypal")}
                  className={`flex-1 p-3 rounded-lg border text-sm ${
                    method === "paypal" ? "border-primary bg-primary/5" : "border-gray-200"
                  }`}
                >
                  {t("payouts.paypal")}
                </button>
              </div>
            </div>
            <div className="flex gap-2 justify-end">
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                {t("payouts.cancel")}
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? t("payouts.submitting") : t("payouts.submit")}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
