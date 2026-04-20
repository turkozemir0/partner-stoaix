import { NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase/server"
import { getTier, getCommissionRate } from "@/lib/utils"

export async function GET() {
  const supabase = createServerSupabaseClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { data: partner } = await supabase
    .from("partners")
    .select("*")
    .eq("user_id", user.id)
    .single()

  if (!partner) {
    return NextResponse.json({ error: "Partner not found" }, { status: 404 })
  }

  const tier = getTier(partner.active_clients)
  const rate = getCommissionRate(tier)

  return NextResponse.json({
    totalEarnings: partner.total_earnings,
    pendingBalance: partner.pending_balance,
    activeClients: partner.active_clients,
    tier,
    commissionRate: rate,
    paidBalance: partner.paid_balance,
  })
}
