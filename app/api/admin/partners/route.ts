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
  const { data: partners, error } = await serviceClient
    .from("partners")
    .select("*")
    .order("created_at", { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ partners })
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
  const { partner_id, status, tier } = body

  if (!partner_id) {
    return NextResponse.json({ error: "partner_id required" }, { status: 400 })
  }

  const updates: Record<string, string> = {}
  if (status) updates.status = status
  if (tier) updates.tier = tier

  const serviceClient = createServiceRoleClient()
  const { error } = await serviceClient
    .from("partners")
    .update(updates)
    .eq("id", partner_id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
