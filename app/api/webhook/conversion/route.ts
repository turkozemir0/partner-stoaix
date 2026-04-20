import { NextRequest, NextResponse } from "next/server"
import { createServiceRoleClient } from "@/lib/supabase/server"
import { getTier, getCommissionRate } from "@/lib/utils"

export async function POST(request: NextRequest) {
  // Verify webhook secret
  const authHeader = request.headers.get("authorization")
  const expectedSecret = `Bearer ${process.env.WEBHOOK_SECRET}`

  if (authHeader !== expectedSecret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = await request.json()
  const { organization_id, org_name, plan_type, monthly_price, referral_code } = body

  if (!organization_id || !referral_code) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
  }

  const supabase = createServiceRoleClient()

  // Find the referral link by code
  const { data: link } = await supabase
    .from("referral_links")
    .select("id, partner_id")
    .eq("code", referral_code)
    .single()

  if (!link) {
    return NextResponse.json({ error: "Invalid referral code" }, { status: 404 })
  }

  // Create conversion record
  const { error: convError } = await supabase.from("conversions").insert({
    partner_id: link.partner_id,
    link_id: link.id,
    organization_id,
    organization_name: org_name,
    plan_type,
    monthly_price,
    status: "active",
  })

  if (convError) {
    return NextResponse.json({ error: "Failed to create conversion" }, { status: 500 })
  }

  // Update link conversion count
  await supabase
    .from("referral_links")
    .update({ conversion_count: link.conversion_count + 1 })
    .eq("id", link.id)

  // Update partner active clients and tier
  const { data: partner } = await supabase
    .from("partners")
    .select("id, active_clients")
    .eq("id", link.partner_id)
    .single()

  if (partner) {
    const newActiveClients = partner.active_clients + 1
    const newTier = getTier(newActiveClients)

    await supabase
      .from("partners")
      .update({
        active_clients: newActiveClients,
        tier: newTier,
      })
      .eq("id", partner.id)

    // Create notification
    await supabase.from("notifications").insert({
      partner_id: link.partner_id,
      type: "conversion",
      title: "New Client Signed Up!",
      message: `${org_name} signed up for the ${plan_type} plan ($${monthly_price}/mo).`,
    })
  }

  return NextResponse.json({ success: true })
}
