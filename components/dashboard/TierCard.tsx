"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import type { PartnerTier } from "@/lib/types"
import { getCommissionRate } from "@/lib/utils"
import { useTranslation } from "@/lib/i18n/useTranslation"

interface TierCardProps {
  currentTier: PartnerTier
  activeClients: number
}

const tierInfo = {
  starter: { labelKey: "tier.starter", color: "bg-gray-100 text-gray-800", next: 5 },
  growth: { labelKey: "tier.growth", color: "bg-blue-100 text-blue-800", next: 10 },
  pro: { labelKey: "tier.pro", color: "bg-purple-100 text-purple-800", next: null },
}

export function TierCard({ currentTier, activeClients }: TierCardProps) {
  const { t } = useTranslation()
  const info = tierInfo[currentTier]
  const rate = getCommissionRate(currentTier)
  const progress = info.next ? (activeClients / info.next) * 100 : 100

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-medium text-muted-foreground">{t("tier.yourTier")}</h3>
          <Badge className={info.color}>{t(info.labelKey)}</Badge>
        </div>
        <p className="text-3xl font-bold font-heading">{(rate * 100).toFixed(0)}%</p>
        <p className="text-xs text-muted-foreground mt-1">{t("tier.commissionRate")}</p>
        {info.next && (
          <div className="mt-4">
            <div className="flex justify-between text-xs text-muted-foreground mb-1">
              <span>{t("tier.activeClients", { count: activeClients })}</span>
              <span>{t("tier.neededForNext", { count: info.next })}</span>
            </div>
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-primary rounded-full transition-all"
                style={{ width: `${Math.min(progress, 100)}%` }}
              />
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
