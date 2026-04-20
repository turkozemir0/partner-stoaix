import { NextRequest, NextResponse } from "next/server"
import { createServiceRoleClient } from "@/lib/supabase/server"

/**
 * Called by platform.stoaix.com when a referred customer's status changes
 * (e.g., they cancel, churn, or reactivate)
 *
 * Payload: { organization_id, status: "active"|"churned"|"cancelled", secret }
 */
export async function POST(request: NextRequest) {
  const authHeader = request.headers.get("authorization")
  if (authHeader !== `Bearer ${process.env.WEBHOOK_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = await request.json()
  const { organization_id, status } = body

  if (!organization_id || !status) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
  }

  if (!["active", "churned", "cancelled"].includes(status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 })
  }

  const supabase = createServiceRoleClient()

  // Find the conversion
  const { data: conversion } = await supabase
    .from("conversions")
    .select("id, partner_id, organization_name, status")
    .eq("organization_id", organization_id)
    .single()

  if (!conversion) {
    return NextResponse.json({ error: "Conversion not found" }, { status: 404 })
  }

  // Skip if status hasn't changed
  if (conversion.status === status) {
    return NextResponse.json({ message: "No change" })
  }

  // Update conversion status
  const updateData: any = { status }
  if (status === "churned" || status === "cancelled") {
    updateData.churned_at = new Date().toISOString()
  } else if (status === "active") {
    updateData.churned_at = null
  }

  await supabase
    .from("conversions")
    .update(updateData)
    .eq("id", conversion.id)

  // Recalculate partner stats (active_clients count + tier)
  await supabase.rpc("recalculate_partner_stats", { p_partner_id: conversion.partner_id })

  // Send notification
  const notifTitle = status === "active"
    ? "Client Reactivated"
    : "Client Churned"
  const notifMessage = status === "active"
    ? `${conversion.organization_name} has reactivated their subscription.`
    : `${conversion.organization_name} has ${status} their subscription.`

  await supabase.from("notifications").insert({
    partner_id: conversion.partner_id,
    type: "conversion",
    title: notifTitle,
    message: notifMessage,
  })

  return NextResponse.json({ success: true })
}
