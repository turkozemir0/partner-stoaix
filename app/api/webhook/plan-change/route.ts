import { NextRequest, NextResponse } from "next/server"
import { createServiceRoleClient } from "@/lib/supabase/server"

/**
 * Called by stoaix.com Stripe webhook when a subscription plan changes.
 *
 * Payload: { organization_id, plan_type, monthly_price }
 */
export async function POST(request: NextRequest) {
  const authHeader = request.headers.get("authorization")
  if (authHeader !== `Bearer ${process.env.WEBHOOK_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = await request.json()
  const { organization_id, plan_type, monthly_price } = body

  if (!organization_id || !plan_type || monthly_price == null) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
  }

  const supabase = createServiceRoleClient()

  // Find the conversion for this organization
  const { data: conversion } = await supabase
    .from("conversions")
    .select("id, partner_id, organization_name, plan_type, monthly_price")
    .eq("organization_id", organization_id)
    .single()

  if (!conversion) {
    return NextResponse.json({ message: "No conversion found, skipping" })
  }

  // Skip if nothing changed
  if (conversion.plan_type === plan_type && Number(conversion.monthly_price) === Number(monthly_price)) {
    return NextResponse.json({ message: "No change" })
  }

  const oldPlan = conversion.plan_type
  const oldPrice = conversion.monthly_price

  // Update conversion with new plan info
  await supabase
    .from("conversions")
    .update({ plan_type, monthly_price })
    .eq("id", conversion.id)

  // Create notification
  await supabase.from("notifications").insert({
    partner_id: conversion.partner_id,
    type: "plan_change",
    title: "Client Plan Changed",
    message: `${conversion.organization_name} changed from ${oldPlan} ($${oldPrice}/mo) to ${plan_type} ($${monthly_price}/mo).`,
  })

  return NextResponse.json({ success: true })
}
