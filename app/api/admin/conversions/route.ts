import { NextRequest, NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase/server"
import { getTier } from "@/lib/utils"

export async function GET() {
  const supabase = createServerSupabaseClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { data: admin } = await supabase
    .from("partners")
    .select("is_admin")
    .eq("user_id", user.id)
    .single()

  if (!admin?.is_admin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const { data: conversions, error } = await supabase
    .from("conversions")
    .select("*, partners(full_name)")
    .order("created_at", { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ conversions })
}

export async function POST(request: NextRequest) {
  const supabase = createServerSupabaseClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { data: admin } = await supabase
    .from("partners")
    .select("is_admin")
    .eq("user_id", user.id)
    .single()

  if (!admin?.is_admin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const body = await request.json()
  const { partner_id, organization_name, organization_id, plan_type, monthly_price } = body

  if (!partner_id || !organization_name || !plan_type || !monthly_price) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
  }

  // Create conversion
  const { error: convError } = await supabase.from("conversions").insert({
    partner_id,
    organization_name,
    organization_id: organization_id || `manual_${Date.now()}`,
    plan_type,
    monthly_price,
    status: "active",
    started_at: new Date().toISOString(),
  })

  if (convError) {
    return NextResponse.json({ error: convError.message }, { status: 500 })
  }

  // Update partner stats
  const { data: partner } = await supabase
    .from("partners")
    .select("active_clients")
    .eq("id", partner_id)
    .single()

  if (partner) {
    const newActiveClients = (partner.active_clients || 0) + 1
    const newTier = getTier(newActiveClients)

    await supabase
      .from("partners")
      .update({ active_clients: newActiveClients, tier: newTier })
      .eq("id", partner_id)
  }

  return NextResponse.json({ success: true })
}
