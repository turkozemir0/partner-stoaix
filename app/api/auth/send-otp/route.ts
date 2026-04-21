import { NextRequest, NextResponse } from "next/server"
import { Resend } from "resend"
import { createServiceRoleClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  try {
    const { email, type } = await request.json()

    if (!email || !type || !["register", "reset", "login"].includes(type)) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 })
    }

    const supabase = createServiceRoleClient()

    // Check if email exists in partners table
    const { data: existingPartner } = await supabase
      .from("partners")
      .select("id")
      .eq("email", email)
      .single()

    if (type === "register" && existingPartner) {
      return NextResponse.json({ error: "Email already registered" }, { status: 409 })
    }

    if ((type === "reset" || type === "login") && !existingPartner) {
      return NextResponse.json({ error: "Email not found" }, { status: 404 })
    }

    // Rate limit: check if OTP was sent in last 60 seconds
    const { data: recentOtp } = await supabase
      .from("otp_codes")
      .select("created_at")
      .eq("email", email)
      .eq("type", type)
      .eq("used", false)
      .order("created_at", { ascending: false })
      .limit(1)
      .single()

    if (recentOtp) {
      const secondsSince = (Date.now() - new Date(recentOtp.created_at).getTime()) / 1000
      if (secondsSince < 60) {
        return NextResponse.json(
          { error: "Please wait before requesting a new code", retryAfter: Math.ceil(60 - secondsSince) },
          { status: 429 }
        )
      }
    }

    // Invalidate old unused codes
    await supabase
      .from("otp_codes")
      .update({ used: true })
      .eq("email", email)
      .eq("type", type)
      .eq("used", false)

    // Generate 6-digit code
    const code = Math.floor(100000 + Math.random() * 900000).toString()

    // Store in DB (expires in 10 minutes)
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString()
    await supabase.from("otp_codes").insert({
      email,
      code,
      type,
      expires_at: expiresAt,
    })

    // Send email via Resend
    const resend = new Resend(process.env.RESEND_API_KEY)
    const subjects: Record<string, string> = {
      register: "Stoaix Partner - E-posta Doğrulama Kodu",
      reset: "Stoaix Partner - Şifre Sıfırlama Kodu",
      login: "Stoaix Partner - Giriş Doğrulama Kodu",
    }
    const descriptions: Record<string, string> = {
      register: "Partner kaydınızı tamamlamak için",
      reset: "Şifrenizi sıfırlamak için",
      login: "Hesabınıza giriş yapmak için",
    }

    await resend.emails.send({
      from: "Stoaix <noreply@stoaix.com>",
      to: email,
      subject: subjects[type],
      html: `
        <div style="font-family: sans-serif; max-width: 400px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #1a1a1a; margin-bottom: 8px;">Doğrulama Kodu</h2>
          <p style="color: #666; margin-bottom: 24px;">
            ${descriptions[type]} aşağıdaki kodu kullanın:
          </p>
          <div style="background: #f5f5f5; border-radius: 8px; padding: 20px; text-align: center; margin-bottom: 24px;">
            <span style="font-size: 32px; font-weight: bold; letter-spacing: 4px; color: #1a1a1a;">${code}</span>
          </div>
          <p style="color: #999; font-size: 12px;">Bu kod 10 dakika içinde geçerliliğini yitirecektir.</p>
        </div>
      `,
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("Send OTP error:", error)
    return NextResponse.json({ error: "Failed to send code" }, { status: 500 })
  }
}
