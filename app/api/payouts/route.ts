import { NextRequest, NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase/server"

const MIN_PAYOUT = 50

export async function GET() {
  const supabase = createServerSupabaseClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { data: partner } = await supabase
    .from("partners")
    .select("id")
    .eq("user_id", user.id)
    .single()
  if (!partner) return NextResponse.json({ error: "Partner not found" }, { status: 404 })

  const { data: payouts } = await supabase
    .from("payouts")
    .select("*")
    .eq("partner_id", partner.id)
    .order("requested_at", { ascending: false })

  return NextResponse.json(payouts || [])
}

export async function POST(request: NextRequest) {
  const supabase = createServerSupabaseClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { data: partner } = await supabase
    .from("partners")
    .select("id, pending_balance")
    .eq("user_id", user.id)
    .single()
  if (!partner) return NextResponse.json({ error: "Partner not found" }, { status: 404 })

  const body = await request.json()
  const { amount, method } = body

  if (!amount || amount < MIN_PAYOUT) {
    return NextResponse.json({ error: `Minimum payout is $${MIN_PAYOUT}` }, { status: 400 })
  }

  if (amount > partner.pending_balance) {
    return NextResponse.json({ error: "Insufficient balance" }, { status: 400 })
  }

  if (!["bank_transfer", "paypal"].includes(method)) {
    return NextResponse.json({ error: "Invalid payment method" }, { status: 400 })
  }

  const { data: payout, error } = await supabase
    .from("payouts")
    .insert({
      partner_id: partner.id,
      amount,
      method,
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: "Failed to create payout request" }, { status: 500 })
  }

  // Deduct from pending balance
  await supabase
    .from("partners")
    .update({ pending_balance: partner.pending_balance - amount })
    .eq("id", partner.id)

  // Create notification
  await supabase.from("notifications").insert({
    partner_id: partner.id,
    type: "payout",
    title: "Payout Requested",
    message: `Your payout request for $${amount.toFixed(2)} has been submitted.`,
  })

  return NextResponse.json(payout, { status: 201 })
}
