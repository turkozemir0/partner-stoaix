import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { formatCurrency, formatDate } from "@/lib/utils"
import type { Conversion } from "@/lib/types"

interface RecentSalesProps {
  conversions: Conversion[]
}

export function RecentSales({ conversions }: RecentSalesProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Recent Sales</CardTitle>
      </CardHeader>
      <CardContent>
        {conversions.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">
            No conversions yet. Share your referral links to get started!
          </p>
        ) : (
          <div className="space-y-4">
            {conversions.map((conversion) => (
              <div key={conversion.id} className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">{conversion.organization_name}</p>
                  <p className="text-xs text-muted-foreground">
                    {conversion.plan_type} &middot; {formatDate(conversion.started_at)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium">{formatCurrency(conversion.monthly_price)}/mo</p>
                  <Badge variant={conversion.status === "active" ? "success" : "destructive"} className="text-[10px]">
                    {conversion.status}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
