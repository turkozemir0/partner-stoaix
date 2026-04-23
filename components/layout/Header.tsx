"use client"

import { useState, useEffect, useRef } from "react"
import { Bell, Menu, ExternalLink } from "lucide-react"
import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/client"
import { MobileNav } from "./MobileNav"
import { LanguageSwitcher } from "./LanguageSwitcher"
import { useTranslation } from "@/lib/i18n/useTranslation"

interface Notification {
  id: string
  type: string
  title: string
  message: string
  is_read: boolean
  created_at: string
}

interface HeaderProps {
  partnerName?: string
}

export function Header({ partnerName }: HeaderProps) {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [loadingNotifs, setLoadingNotifs] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const supabase = createClient()
  const { t } = useTranslation()

  useEffect(() => {
    async function fetchUnread() {
      const { count } = await supabase
        .from("notifications")
        .select("*", { count: "exact", head: true })
        .eq("is_read", false)
      setUnreadCount(count || 0)
    }
    fetchUnread()
  }, [])

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false)
      }
    }
    if (dropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside)
      return () => document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [dropdownOpen])

  async function openNotifications() {
    setDropdownOpen((prev) => !prev)
    if (!dropdownOpen) {
      setLoadingNotifs(true)
      const { data } = await supabase
        .from("notifications")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(10)
      setNotifications(data || [])
      setLoadingNotifs(false)

      // Mark all as read
      if (unreadCount > 0) {
        await supabase
          .from("notifications")
          .update({ is_read: true })
          .eq("is_read", false)
        setUnreadCount(0)
      }
    }
  }

  function timeAgo(dateStr: string) {
    const diff = Date.now() - new Date(dateStr).getTime()
    const mins = Math.floor(diff / 60000)
    if (mins < 1) return "just now"
    if (mins < 60) return `${mins}m ago`
    const hours = Math.floor(mins / 60)
    if (hours < 24) return `${hours}h ago`
    const days = Math.floor(hours / 24)
    return `${days}d ago`
  }

  return (
    <>
      <header className="sticky top-0 z-40 flex h-16 items-center gap-4 border-b bg-white px-4 md:px-6">
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          onClick={() => setMobileOpen(true)}
        >
          <Menu className="h-5 w-5" />
        </Button>
        <div className="flex-1" />
        <div className="flex items-center gap-4">
          <a
            href="https://stoaix.com"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden sm:inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
          >
            stoaix.com
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
          <LanguageSwitcher />
          <div className="relative" ref={dropdownRef}>
            <Button
              variant="ghost"
              size="icon"
              className="relative"
              onClick={openNotifications}
            >
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-red-500 text-[10px] font-bold text-white flex items-center justify-center">
                  {unreadCount}
                </span>
              )}
            </Button>
            {dropdownOpen && (
              <div className="absolute right-0 top-10 w-80 rounded-lg border bg-white shadow-lg z-50">
                <div className="border-b px-4 py-3">
                  <h3 className="text-sm font-semibold">Notifications</h3>
                </div>
                <div className="max-h-80 overflow-y-auto">
                  {loadingNotifs ? (
                    <div className="px-4 py-6 text-center text-sm text-muted-foreground">Loading...</div>
                  ) : notifications.length === 0 ? (
                    <div className="px-4 py-6 text-center text-sm text-muted-foreground">No notifications</div>
                  ) : (
                    notifications.map((n) => (
                      <div
                        key={n.id}
                        className={`px-4 py-3 border-b last:border-0 ${!n.is_read ? "bg-blue-50/50" : ""}`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-sm font-medium">{n.title}</p>
                          <span className="text-[11px] text-muted-foreground whitespace-nowrap">
                            {timeAgo(n.created_at)}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">{n.message}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
          <div className="hidden md:flex items-center gap-2">
            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium text-primary">
              {partnerName?.charAt(0)?.toUpperCase() || "P"}
            </div>
            <span className="text-sm font-medium">{partnerName || "Partner"}</span>
          </div>
        </div>
      </header>
      <MobileNav open={mobileOpen} onClose={() => setMobileOpen(false)} />
    </>
  )
}
