"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useTranslation } from "@/lib/i18n/useTranslation"
import type { Partner } from "@/lib/types"

export default function SettingsPage() {
  const { t } = useTranslation()
  const [partner, setPartner] = useState<Partner | null>(null)
  const [fullName, setFullName] = useState("")
  const [phone, setPhone] = useState("")
  const [companyName, setCompanyName] = useState("")
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    async function fetchPartner() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data } = await supabase
        .from("partners")
        .select("*")
        .eq("user_id", user.id)
        .single()
      if (data) {
        setPartner(data)
        setFullName(data.full_name)
        setPhone(data.phone || "")
        setCompanyName(data.company_name || "")
      }
    }
    fetchPartner()
  }, [])

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!partner) return
    setSaving(true)
    setSuccess(false)

    await supabase
      .from("partners")
      .update({
        full_name: fullName,
        phone,
        company_name: companyName || null,
      })
      .eq("id", partner.id)

    setSaving(false)
    setSuccess(true)
    setTimeout(() => setSuccess(false), 3000)
  }

  if (!partner) {
    return <div className="flex items-center justify-center h-64 text-muted-foreground">{t("common.loading")}</div>
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold font-heading">{t("settings.title")}</h1>
        <p className="text-muted-foreground text-sm">{t("settings.subtitle")}</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t("settings.profileInfo")}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSave} className="space-y-4 max-w-md">
            <div className="space-y-2">
              <label className="text-sm font-medium">{t("settings.email")}</label>
              <Input value={partner.email} disabled className="bg-gray-50" />
              <p className="text-xs text-muted-foreground">{t("settings.emailHint")}</p>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">{t("settings.fullName")}</label>
              <Input
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">{t("settings.phone")}</label>
              <Input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+1 (555) 000-0000"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">{t("settings.company")}</label>
              <Input
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder={t("settings.companyPlaceholder")}
              />
            </div>
            <div className="flex items-center gap-3">
              <Button type="submit" disabled={saving}>
                {saving ? t("settings.saving") : t("settings.saveChanges")}
              </Button>
              {success && <span className="text-sm text-emerald-600">{t("settings.saved")}</span>}
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t("settings.account")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-sm font-medium">{t("settings.partnerId")}</p>
            <code className="text-xs bg-gray-100 px-2 py-1 rounded">{partner.id}</code>
          </div>
          <div>
            <p className="text-sm font-medium">{t("settings.memberSince")}</p>
            <p className="text-sm text-muted-foreground">
              {new Date(partner.created_at).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
