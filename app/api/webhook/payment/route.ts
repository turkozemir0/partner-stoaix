import { NextRequest, NextResponse } from "next/server"
import { createServiceRoleClient } from "@/lib/supabase/server"

/**
 * Called by stoaix.com Stripe webhook when an invoice is paid.
 * Records real payment data for commission calculation.
 *
 * Payload: {
 *   organization_id, stripe_invoice_id, amount, currency,
 *   period_start, period_end, plan_type?, monthly_price?
 * }
 */
export async function POST(request: NextRequest) {
  const authHeader = request.headers.get("authorization")
  if (authHeader !== `Bearer ${process.env.WEBHOOK_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = await request.json()
  const {
    organization_id,
    stripe_invoice_id,
    amount,
    currency,
    period_start,
    period_end,
    plan_type,
    monthly_price,
  } = body

  if (!organization_id || !stripe_invoice_id || amount == null) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
  }

  const supabase = createServiceRoleClient()

  // Find the conversion for this organization
  const { data: conversion } = await supabase
    .from("conversions")
    .select("id, partner_id, organization_name, status")
    .eq("organization_id", organization_id)
    .single()

  if (!conversion) {
    // Not a referred org — ignore silently
    return NextResponse.json({ message: "No conversion found, skipping" })
  }

  // Insert payment record (stripe_invoice_id UNIQUE ensures idempotency)
  const { error: paymentError } = await supabase.from("payments").insert({
    conversion_id: conversion.id,
    organization_id,
    stripe_invoice_id,
    amount,
    currency: currency || "usd",
    period_start: period_start || null,
    period_end: period_end || null,
    paid_at: new Date().toISOString(),
  })

  if (paymentError) {
    // Duplicate invoice — idempotent, not an error
    if (paymentError.code === "23505") {
      return NextResponse.json({ message: "Payment already recorded" })
    }
    console.error("Payment insert error:", paymentError)
    return NextResponse.json({ error: "Failed to record payment" }, { status: 500 })
  }

  // Update conversion plan/price if provided
  if (plan_type || monthly_price) {
    const updateData: Record<string, unknown> = {}
    if (plan_type) updateData.plan_type = plan_type
    if (monthly_price) updateData.monthly_price = monthly_price
    await supabase.from("conversions").update(updateData).eq("id", conversion.id)
  }

  // Mark conversion as active (payment received = active)
  if (conversion.status !== "active") {
    await supabase
      .from("conversions")
      .update({ status: "active", churned_at: null })
      .eq("id", conversion.id)

    await supabase.rpc("recalculate_partner_stats", { p_partner_id: conversion.partner_id })
  }

  // Create notification
  await supabase.from("notifications").insert({
    partner_id: conversion.partner_id,
    type: "payment",
    title: "Payment Received",
    message: `${conversion.organization_name} paid $${Number(amount).toFixed(2)}.`,
  })

  return NextResponse.json({ success: true })
}
