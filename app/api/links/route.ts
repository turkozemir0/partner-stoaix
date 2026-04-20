import { NextRequest, NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase/server"
import { generateReferralCode } from "@/lib/utils"

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

  const { data: links } = await supabase
    .from("referral_links")
    .select("*")
    .eq("partner_id", partner.id)
    .order("created_at", { ascending: false })

  return NextResponse.json(links || [])
}

export async function POST(request: NextRequest) {
  const supabase = createServerSupabaseClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { data: partner } = await supabase
    .from("partners")
    .select("id")
    .eq("user_id", user.id)
    .single()
  if (!partner) return NextResponse.json({ error: "Partner not found" }, { status: 404 })

  const body = await request.json()
  const { label, destination_url } = body

  if (!label) {
    return NextResponse.json({ error: "Label is required" }, { status: 400 })
  }

  const code = generateReferralCode()

  const { data: link, error } = await supabase
    .from("referral_links")
    .insert({
      partner_id: partner.id,
      code,
      label,
      destination_url: destination_url || "https://stoaix.com",
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: "Failed to create link" }, { status: 500 })
  }

  return NextResponse.json(link, { status: 201 })
}
