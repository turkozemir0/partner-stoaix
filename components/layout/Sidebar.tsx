"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import {
  LayoutDashboard,
  Link2,
  TrendingUp,
  DollarSign,
  CreditCard,
  FileText,
  Settings,
  LogOut,
  Shield,
  Users,
  ArrowRightLeft,
  Wallet,
} from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { useTranslation } from "@/lib/i18n/useTranslation"

const navItems = [
  { href: "/", labelKey: "nav.dashboard", icon: LayoutDashboard },
  { href: "/links", labelKey: "nav.links", icon: Link2 },
  { href: "/sales", labelKey: "nav.sales", icon: TrendingUp },
  { href: "/earnings", labelKey: "nav.earnings", icon: DollarSign },
  { href: "/payouts", labelKey: "nav.payouts", icon: CreditCard },
  { href: "/materials", labelKey: "nav.materials", icon: FileText },
  { href: "/settings", labelKey: "nav.settings", icon: Settings },
]

const adminItems = [
  { href: "/admin", labelKey: "nav.adminOverview", icon: Shield },
  { href: "/admin/partners", labelKey: "nav.adminPartners", icon: Users },
  { href: "/admin/conversions", labelKey: "nav.adminConversions", icon: ArrowRightLeft },
  { href: "/admin/payouts", labelKey: "nav.adminPayouts", icon: Wallet },
]

interface SidebarProps {
  isAdmin?: boolean
}

export function Sidebar({ isAdmin }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()
  const { t } = useTranslation()

  async function handleLogout() {
    await supabase.auth.signOut()
    document.cookie = "session_started_at=; path=/; max-age=0"
    router.push("/login")
    router.refresh()
  }

  return (
    <aside className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0 bg-white border-r">
      <div className="flex flex-col flex-1 min-h-0">
        <div className="flex items-center h-16 px-6 border-b">
          <span className="text-xl font-bold text-primary font-heading">Stoaix</span>
          <span className="ml-2 text-xs font-medium text-muted-foreground bg-secondary px-2 py-0.5 rounded">Partner</span>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors",
                  isActive
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-gray-100 hover:text-foreground"
                )}
              >
                <item.icon className="h-4 w-4" />
                {t(item.labelKey)}
              </Link>
            )
          })}

          {isAdmin && (
            <>
              <div className="pt-4 pb-1 px-3">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{t("nav.admin")}</span>
              </div>
              {adminItems.map((item) => {
                const isActive = pathname === item.href
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors",
                      isActive
                        ? "bg-primary/10 text-primary"
                        : "text-muted-foreground hover:bg-gray-100 hover:text-foreground"
                    )}
                  >
                    <item.icon className="h-4 w-4" />
                    {t(item.labelKey)}
                  </Link>
                )
              })}
            </>
          )}
        </nav>
        <div className="p-3 border-t">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2 text-sm font-medium text-muted-foreground rounded-lg hover:bg-gray-100 hover:text-foreground transition-colors w-full"
          >
            <LogOut className="h-4 w-4" />
            {t("nav.signOut")}
          </button>
        </div>
      </div>
    </aside>
  )
}
