import { NextRequest, NextResponse } from "next/server"
import { createServiceRoleClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  try {
    const { email, code, type } = await request.json()

    if (!email || !code || !type || !["register", "reset", "login"].includes(type)) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 })
    }

    const supabase = createServiceRoleClient()

    // Find matching, unused, non-expired code
    const { data: otpRecord } = await supabase
      .from("otp_codes")
      .select("*")
      .eq("email", email)
      .eq("code", code)
      .eq("type", type)
      .eq("used", false)
      .gt("expires_at", new Date().toISOString())
      .order("created_at", { ascending: false })
      .limit(1)
      .single()

    if (!otpRecord) {
      return NextResponse.json({ error: "Invalid or expired code" }, { status: 400 })
    }

    // Mark as used
    await supabase
      .from("otp_codes")
      .update({ used: true })
      .eq("id", otpRecord.id)

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("Verify OTP error:", error)
    return NextResponse.json({ error: "Verification failed" }, { status: 500 })
  }
}
