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
  const { data: requests, error } = await serviceClient
    .from("demo_requests")
    .select("*, partners(full_name, email, company_name)")
    .order("created_at", { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ requests })
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
  const { id, status, admin_note } = body

  if (!id || !status || !["approved", "rejected"].includes(status)) {
    return NextResponse.json(
      { error: "id and status (approved/rejected) required" },
      { status: 400 }
    )
  }

  const serviceClient = createServiceRoleClient()

  // Get the request to find the partner
  const { data: demoRequest } = await serviceClient
    .from("demo_requests")
    .select("partner_id")
    .eq("id", id)
    .single()

  if (!demoRequest) {
    return NextResponse.json({ error: "Request not found" }, { status: 404 })
  }

  // Update the request
  const { error } = await serviceClient
    .from("demo_requests")
    .update({
      status,
      admin_note: admin_note || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Notify the partner
  const title = status === "approved"
    ? "Demo Account Approved"
    : "Demo Account Request Rejected"
  const message = status === "approved"
    ? "Your demo account request has been approved."
    : "Your demo account request has been rejected."

  await serviceClient.from("notifications").insert({
    partner_id: demoRequest.partner_id,
    type: "demo_request",
    title,
    message: admin_note ? `${message} Note: ${admin_note}` : message,
  })

  return NextResponse.json({ success: true })
}
