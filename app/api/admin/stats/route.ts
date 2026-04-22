import { NextResponse } from "next/server"
import { createServerSupabaseClient, createServiceRoleClient } from "@/lib/supabase/server"

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

  const serviceClient = createServiceRoleClient()
  const { data: partners } = await serviceClient.from("partners").select("*")
  const { data: conversions } = await serviceClient.from("conversions").select("*")
  const { data: payouts } = await serviceClient.from("payouts").select("*, partners(full_name)")

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const partnerList = (partners || []) as any[]
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const conversionList = (conversions || []) as any[]
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const payoutList = (payouts || []) as any[]

  const totalPartners = partnerList.length
  const totalActiveClients = partnerList.reduce((sum: number, p: any) => sum + (p.active_clients || 0), 0)
  const totalRevenue = conversionList
    .filter((c: any) => c.status === "active")
    .reduce((sum: number, c: any) => sum + (c.monthly_price || 0), 0)
  const totalCommissions = partnerList.reduce((sum: number, p: any) => sum + (p.total_earnings || 0), 0)
  const pendingPayouts = payoutList
    .filter((p: any) => p.status === "pending")
    .reduce((sum: number, p: any) => sum + (p.amount || 0), 0)

  const recentPayouts = payoutList
    .filter((p: any) => p.status === "pending")
    .sort((a: any, b: any) => new Date(b.requested_at).getTime() - new Date(a.requested_at).getTime())
    .slice(0, 5)

  return NextResponse.json({
    totalPartners,
    totalActiveClients,
    totalRevenue,
    totalCommissions,
    pendingPayouts,
    recentPayouts,
  })
}
