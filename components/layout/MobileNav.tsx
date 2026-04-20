"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { createClient } from "@/lib/supabase/client"
import { X, LayoutDashboard, Link2, TrendingUp, DollarSign, CreditCard, FileText, Settings, LogOut } from "lucide-react"

const navItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/links", label: "Referral Links", icon: Link2 },
  { href: "/sales", label: "Sales", icon: TrendingUp },
  { href: "/earnings", label: "Earnings", icon: DollarSign },
  { href: "/payouts", label: "Payouts", icon: CreditCard },
  { href: "/materials", label: "Materials", icon: FileText },
  { href: "/settings", label: "Settings", icon: Settings },
]

interface MobileNavProps {
  open: boolean
  onClose: () => void
}

export function MobileNav({ open, onClose }: MobileNavProps) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push("/login")
    router.refresh()
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 md:hidden">
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />
      <div className="fixed inset-y-0 left-0 w-72 bg-white shadow-xl">
        <div className="flex items-center justify-between h-16 px-6 border-b">
          <span className="text-xl font-bold text-primary font-heading">Stoaix</span>
          <button onClick={onClose}>
            <X className="h-5 w-5" />
          </button>
        </div>
        <nav className="px-3 py-4 space-y-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors",
                  isActive
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-gray-100 hover:text-foreground"
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            )
          })}
        </nav>
        <div className="absolute bottom-0 left-0 right-0 p-3 border-t">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2 text-sm font-medium text-muted-foreground rounded-lg hover:bg-gray-100 w-full"
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </button>
        </div>
      </div>
    </div>
  )
}
