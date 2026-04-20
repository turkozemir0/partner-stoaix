"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Plus, Copy, Trash2 } from "lucide-react"
import { generateReferralCode } from "@/lib/utils"
import { useTranslation } from "@/lib/i18n/useTranslation"
import type { ReferralLink } from "@/lib/types"

export default function LinksPage() {
  const { t } = useTranslation()
  const [links, setLinks] = useState<ReferralLink[]>([])
  const [dialogOpen, setDialogOpen] = useState(false)
  const [label, setLabel] = useState("")
  const [destination, setDestination] = useState("https://stoaix.com/signup")
  const [loading, setLoading] = useState(false)
  const [partnerId, setPartnerId] = useState("")
  const [copied, setCopied] = useState<string | null>(null)
  const supabase = createClient()

  useEffect(() => {
    fetchLinks()
  }, [])

  async function fetchLinks() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: partner } = await supabase
      .from("partners")
      .select("id")
      .eq("user_id", user.id)
      .single()
    if (!partner) return
    setPartnerId(partner.id)

    const { data } = await supabase
      .from("referral_links")
      .select("*")
      .eq("partner_id", partner.id)
      .order("created_at", { ascending: false })
    if (data) setLinks(data)
  }

  async function createLink(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    const code = generateReferralCode()
    const { error } = await supabase.from("referral_links").insert({
      partner_id: partnerId,
      code,
      label,
      destination_url: destination,
    })

    if (!error) {
      setDialogOpen(false)
      setLabel("")
      setDestination("https://stoaix.com")
      fetchLinks()
    }
    setLoading(false)
  }

  async function toggleLink(id: string, isActive: boolean) {
    await supabase.from("referral_links").update({ is_active: !isActive }).eq("id", id)
    fetchLinks()
  }

  async function deleteLink(id: string) {
    if (!confirm(t("links.deleteConfirm"))) return
    await supabase.from("referral_links").delete().eq("id", id)
    fetchLinks()
  }

  function copyLink(code: string) {
    const url = `${window.location.origin}/r/${code}`
    navigator.clipboard.writeText(url)
    setCopied(code)
    setTimeout(() => setCopied(null), 2000)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-heading">{t("links.title")}</h1>
          <p className="text-muted-foreground text-sm">{t("links.subtitle")}</p>
        </div>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          {t("links.createLink")}
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("links.label")}</TableHead>
                <TableHead>{t("links.code")}</TableHead>
                <TableHead>{t("links.clicks")}</TableHead>
                <TableHead>{t("links.conversions")}</TableHead>
                <TableHead>{t("links.status")}</TableHead>
                <TableHead className="text-right">{t("links.actions")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {links.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    {t("links.noLinks")}
                  </TableCell>
                </TableRow>
              ) : (
                links.map((link) => (
                  <TableRow key={link.id}>
                    <TableCell className="font-medium">{link.label}</TableCell>
                    <TableCell>
                      <code className="text-xs bg-gray-100 px-2 py-1 rounded">{link.code}</code>
                    </TableCell>
                    <TableCell>{link.click_count}</TableCell>
                    <TableCell>{link.conversion_count}</TableCell>
                    <TableCell>
                      <Badge
                        variant={link.is_active ? "success" : "secondary"}
                        className="cursor-pointer"
                        onClick={() => toggleLink(link.id, link.is_active)}
                      >
                        {link.is_active ? t("links.active") : t("links.inactive")}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => copyLink(link.code)}
                          title="Copy link"
                        >
                          <Copy className={`h-4 w-4 ${copied === link.code ? "text-green-600" : ""}`} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => deleteLink(link.id)}
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    </TableCell>
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
            <DialogTitle>{t("links.dialogTitle")}</DialogTitle>
          </DialogHeader>
          <form onSubmit={createLink} className="space-y-4 mt-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">{t("links.labelField")}</label>
              <Input
                placeholder={t("links.labelPlaceholder")}
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">{t("links.destinationField")}</label>
              <Input
                placeholder="https://stoaix.com"
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                required
              />
            </div>
            <div className="flex gap-2 justify-end">
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                {t("links.cancel")}
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? t("links.creating") : t("links.create")}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
