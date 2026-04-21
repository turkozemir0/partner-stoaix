import { NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase/server"

export async function GET() {
  const supabase = createServerSupabaseClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { data: partner } = await supabase
    .from("partners")
    .select("id")
    .eq("user_id", user.id)
    .single()

  if (!partner) {
    return NextResponse.json({ error: "Partner not found" }, { status: 404 })
  }

  const { data: requests, error } = await supabase
    .from("demo_requests")
    .select("*")
    .eq("partner_id", partner.id)
    .order("created_at", { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ requests })
}

export async function POST() {
  const supabase = createServerSupabaseClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { data: partner } = await supabase
    .from("partners")
    .select("id, full_name")
    .eq("user_id", user.id)
    .single()

  if (!partner) {
    return NextResponse.json({ error: "Partner not found" }, { status: 404 })
  }

  // Check if there's already a pending or approved request
  const { data: existing } = await supabase
    .from("demo_requests")
    .select("id, status")
    .eq("partner_id", partner.id)
    .in("status", ["pending", "approved"])
    .limit(1)

  if (existing && existing.length > 0) {
    return NextResponse.json(
      { error: "You already have an active demo request" },
      { status: 409 }
    )
  }

  // Create the request
  const { data: request, error } = await supabase
    .from("demo_requests")
    .insert({ partner_id: partner.id })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Notify all admins
  const { data: admins } = await supabase
    .from("partners")
    .select("id")
    .eq("is_admin", true)

  if (admins && admins.length > 0) {
    const notifications = admins.map((admin) => ({
      partner_id: admin.id,
      type: "demo_request",
      title: "New Demo Account Request",
      message: `${partner.full_name} has requested a demo account.`,
    }))

    await supabase.from("notifications").insert(notifications)
  }

  return NextResponse.json({ request })
}
