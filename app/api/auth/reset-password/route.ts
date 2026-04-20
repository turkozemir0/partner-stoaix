import { NextRequest, NextResponse } from "next/server"
import { createServiceRoleClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  try {
    const { email, newPassword } = await request.json()

    if (!email || !newPassword) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    if (newPassword.length < 8) {
      return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 400 })
    }

    const supabase = createServiceRoleClient()

    // Check if there's a verified OTP in the last 15 minutes
    const fifteenMinAgo = new Date(Date.now() - 15 * 60 * 1000).toISOString()
    const { data: verifiedOtp } = await supabase
      .from("otp_codes")
      .select("id")
      .eq("email", email)
      .eq("type", "reset")
      .eq("used", true)
      .gt("created_at", fifteenMinAgo)
      .limit(1)
      .single()

    if (!verifiedOtp) {
      return NextResponse.json({ error: "Email not verified. Please verify your email first." }, { status: 403 })
    }

    // Find user by email
    const { data: partner } = await supabase
      .from("partners")
      .select("user_id")
      .eq("email", email)
      .single()

    if (!partner) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Update password
    const { error: updateError } = await supabase.auth.admin.updateUserById(partner.user_id, {
      password: newPassword,
    })

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 400 })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("Reset password error:", error)
    return NextResponse.json({ error: "Password reset failed" }, { status: 500 })
  }
}
