import { NextRequest, NextResponse } from "next/server"
import { createServiceRoleClient } from "@/lib/supabase/server"
import crypto from "crypto"

export async function GET(
  request: NextRequest,
  context: { params: { code: string } }
) {
  try {
    const supabase = createServiceRoleClient()
    const { code } = context.params

    // Find the referral link
    const { data: link } = await supabase
      .from("referral_links")
      .select("id, destination_url, is_active, click_count")
      .eq("code", code)
      .single()

    if (!link || !link.is_active) {
      return NextResponse.redirect(new URL("https://stoaix.com"))
    }

    // Record the click
    const ip = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown"
    const ipHash = crypto.createHash("sha256").update(ip).digest("hex").substring(0, 16)
    const userAgent = request.headers.get("user-agent") || ""
    const referrer = request.headers.get("referer") || ""

    await supabase.from("clicks").insert({
      link_id: link.id,
      ip_hash: ipHash,
      user_agent: userAgent,
      referrer: referrer,
      country: "",
    })

    // Increment click count
    await supabase.rpc("increment_click_count", { link_id: link.id }).catch(() => {
      supabase
        .from("referral_links")
        .update({ click_count: link.click_count + 1 })
        .eq("id", link.id)
    })

    // Redirect to destination with ref param
    const destination = new URL(link.destination_url)
    destination.searchParams.set("ref", code)

    return NextResponse.redirect(destination.toString())
  } catch (err) {
    console.error("Referral redirect error:", err)
    // Still redirect with ref param so cookie gets set even if DB fails
    const { code } = context.params
    return NextResponse.redirect(`https://stoaix.com/signup?ref=${code}`)
  }
}
