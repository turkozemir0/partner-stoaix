import { NextRequest, NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase/server"

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createServerSupabaseClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await request.json()
  const { label, destination_url, is_active } = body

  const updateData: Record<string, any> = {}
  if (label !== undefined) updateData.label = label
  if (destination_url !== undefined) updateData.destination_url = destination_url
  if (is_active !== undefined) updateData.is_active = is_active

  const { data, error } = await supabase
    .from("referral_links")
    .update(updateData)
    .eq("id", params.id)
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: "Failed to update link" }, { status: 500 })
  }

  return NextResponse.json(data)
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createServerSupabaseClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { error } = await supabase
    .from("referral_links")
    .delete()
    .eq("id", params.id)

  if (error) {
    return NextResponse.json({ error: "Failed to delete link" }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
