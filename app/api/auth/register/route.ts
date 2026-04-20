import { NextRequest, NextResponse } from "next/server"
import { createServiceRoleClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  try {
    const { email, password, fullName, phone, companyName } = await request.json()

    if (!email || !password || !fullName) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    if (password.length < 8) {
      return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 400 })
    }

    const supabase = createServiceRoleClient()

    // Check if there's a verified OTP in the last 15 minutes
    const fifteenMinAgo = new Date(Date.now() - 15 * 60 * 1000).toISOString()
    const { data: verifiedOtp } = await supabase
      .from("otp_codes")
      .select("id")
      .eq("email", email)
      .eq("type", "register")
      .eq("used", true)
      .gt("created_at", fifteenMinAgo)
      .limit(1)
      .single()

    if (!verifiedOtp) {
      return NextResponse.json({ error: "Email not verified. Please verify your email first." }, { status: 403 })
    }

    // Create user with admin API (email already confirmed)
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        full_name: fullName,
        phone,
        company_name: companyName,
      },
    })

    if (authError) {
      return NextResponse.json({ error: authError.message }, { status: 400 })
    }

    // Update partner record with phone and company if the trigger created it
    if (authData.user) {
      await supabase
        .from("partners")
        .update({
          phone: phone || null,
          company_name: companyName || null,
        })
        .eq("user_id", authData.user.id)
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("Register error:", error)
    return NextResponse.json({ error: "Registration failed" }, { status: 500 })
  }
}
