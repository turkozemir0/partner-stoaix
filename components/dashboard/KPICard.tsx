import { cn } from "@/lib/utils"
import { Card, CardContent } from "@/components/ui/card"
import { LucideIcon } from "lucide-react"

interface KPICardProps {
  title: string
  value: string
  description?: string
  icon: LucideIcon
  trend?: { value: number; positive: boolean }
  className?: string
}

export function KPICard({ title, value, description, icon: Icon, trend, className }: KPICardProps) {
  return (
    <Card className={cn("", className)}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <Icon className="h-4 w-4 text-primary" />
          </div>
        </div>
        <div className="mt-3">
          <p className="text-2xl font-bold font-heading">{value}</p>
          {trend && (
            <p className={cn("text-xs mt-1", trend.positive ? "text-emerald-600" : "text-red-600")}>
              {trend.positive ? "+" : ""}{trend.value}% from last month
            </p>
          )}
          {description && (
            <p className="text-xs text-muted-foreground mt-1">{description}</p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
