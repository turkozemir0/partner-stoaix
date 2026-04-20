import { NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase/server"

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

  const { data: commissions } = await supabase
    .from("monthly_commissions")
    .select("*")
    .eq("partner_id", partner.id)
    .order("period", { ascending: false })

  return NextResponse.json(commissions || [])
}
