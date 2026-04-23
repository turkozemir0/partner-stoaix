import { NextRequest, NextResponse } from "next/server"
import { createServiceRoleClient } from "@/lib/supabase/server"

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
    status: "trial",
  })

  if (convError) {
    return NextResponse.json({ error: "Failed to create conversion" }, { status: 500 })
  }

  // Update link conversion count
  await supabase
    .from("referral_links")
    .update({ conversion_count: link.conversion_count + 1 })
    .eq("id", link.id)

  // Create notification (no tier/active_clients update — trial doesn't count)
  await supabase.from("notifications").insert({
    partner_id: link.partner_id,
    type: "conversion",
    title: "New Trial Started",
    message: `${org_name} started a free trial for the ${plan_type} plan.`,
  })

  return NextResponse.json({ success: true })
}
