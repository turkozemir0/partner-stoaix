import { NextRequest, NextResponse } from "next/server"
import { createServerSupabaseClient, createServiceRoleClient } from "@/lib/supabase/server"

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

  const serviceClient = createServiceRoleClient()
  const { data: payouts, error } = await serviceClient
    .from("payouts")
    .select("*, partners(full_name, email)")
    .order("requested_at", { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ payouts })
}

export async function PATCH(request: NextRequest) {
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
  const { payout_id, action, reference } = body

  if (!payout_id || !action) {
    return NextResponse.json({ error: "payout_id and action required" }, { status: 400 })
  }

  const serviceClient = createServiceRoleClient()

  if (action === "approve") {
    // Get payout details
    const { data: payout } = await serviceClient
      .from("payouts")
      .select("*")
      .eq("id", payout_id)
      .single()

    if (!payout) {
      return NextResponse.json({ error: "Payout not found" }, { status: 404 })
    }

    // Update payout status
    await serviceClient
      .from("payouts")
      .update({
        status: "completed",
        reference: reference || null,
        processed_at: new Date().toISOString(),
      })
      .eq("id", payout_id)

    // Update partner balances
    const { data: partner } = await serviceClient
      .from("partners")
      .select("pending_balance, paid_balance")
      .eq("id", payout.partner_id)
      .single()

    if (partner) {
      await serviceClient
        .from("partners")
        .update({
          pending_balance: (partner.pending_balance || 0) - payout.amount,
          paid_balance: (partner.paid_balance || 0) + payout.amount,
        })
        .eq("id", payout.partner_id)
    }
  } else if (action === "reject") {
    await serviceClient
      .from("payouts")
      .update({
        status: "failed",
        processed_at: new Date().toISOString(),
      })
      .eq("id", payout_id)
  } else {
    return NextResponse.json({ error: "Invalid action" }, { status: 400 })
  }

  return NextResponse.json({ success: true })
}
