import { NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase/server"

export async function GET() {
  const supabase = createServerSupabaseClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { data: partner } = await supabase
    .from("partners")
    .select("is_admin")
    .eq("user_id", user.id)
    .single()

  if (!partner?.is_admin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const { data: partners } = await supabase.from("partners").select("*")
  const { data: conversions } = await supabase.from("conversions").select("*")
  const { data: payouts } = await supabase.from("payouts").select("*")

  const totalPartners = partners?.length || 0
  const totalActiveClients = partners?.reduce((sum, p) => sum + (p.active_clients || 0), 0) || 0
  const totalRevenue = conversions
    ?.filter(c => c.status === "active")
    .reduce((sum, c) => sum + (c.monthly_price || 0), 0) || 0
  const totalCommissions = partners?.reduce((sum, p) => sum + (p.total_earnings || 0), 0) || 0
  const pendingPayouts = payouts
    ?.filter(p => p.status === "pending")
    .reduce((sum, p) => sum + (p.amount || 0), 0) || 0

  const recentPayouts = payouts
    ?.filter(p => p.status === "pending")
    .sort((a, b) => new Date(b.requested_at).getTime() - new Date(a.requested_at).getTime())
    .slice(0, 5) || []

  return NextResponse.json({
    totalPartners,
    totalActiveClients,
    totalRevenue,
    totalCommissions,
    pendingPayouts,
    recentPayouts,
  })
}
