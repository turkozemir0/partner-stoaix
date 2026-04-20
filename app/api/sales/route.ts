import { NextRequest, NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
  const supabase = createServerSupabaseClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { data: partner } = await supabase
    .from("partners")
    .select("id")
    .eq("user_id", user.id)
    .single()
  if (!partner) return NextResponse.json({ error: "Partner not found" }, { status: 404 })

  const searchParams = request.nextUrl.searchParams
  const status = searchParams.get("status")
  const page = parseInt(searchParams.get("page") || "1")
  const limit = parseInt(searchParams.get("limit") || "20")
  const offset = (page - 1) * limit

  let query = supabase
    .from("conversions")
    .select("*", { count: "exact" })
    .eq("partner_id", partner.id)
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1)

  if (status && status !== "all") {
    query = query.eq("status", status)
  }

  const { data, count } = await query

  return NextResponse.json({
    data: data || [],
    total: count || 0,
    page,
    limit,
  })
}
