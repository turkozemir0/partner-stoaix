import { NextRequest, NextResponse } from "next/server"
import { createServiceRoleClient } from "@/lib/supabase/server"
import crypto from "crypto"

export async function GET(
  request: NextRequest,
  context: { params: { code: string } }
) {
  const { code } = context.params
  const fallbackUrl = `https://stoaix.com?ref=${code}`

  let supabase
  try {
    supabase = createServiceRoleClient()
  } catch (err) {
    console.error("Supabase client error:", err)
    return NextResponse.redirect(fallbackUrl)
  }

  // Find the referral link
  const { data: link, error: linkError } = await supabase
    .from("referral_links")
    .select("id, destination_url, is_active, click_count")
    .eq("code", code)
    .single()

  if (linkError) {
    console.error("Link query error:", linkError)
    return NextResponse.redirect(fallbackUrl)
  }

  if (!link || !link.is_active) {
    return NextResponse.redirect(fallbackUrl)
  }

  // Record click + increment count (non-blocking, don't await)
  const ip = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown"
  const ipHash = crypto.createHash("sha256").update(ip).digest("hex").substring(0, 16)
  const userAgent = request.headers.get("user-agent") || ""
  const referrer = request.headers.get("referer") || ""

  // Fire and forget — don't block redirect
  supabase.from("clicks").insert({
    link_id: link.id,
    ip_hash: ipHash,
    user_agent: userAgent,
    referrer: referrer,
    country: "",
  }).then(() => {
    supabase
      .from("referral_links")
      .update({ click_count: (link.click_count || 0) + 1 })
      .eq("id", link.id)
      .then(() => {})
      .catch((e: unknown) => console.error("Click count update error:", e))
  }).catch((e: unknown) => console.error("Click insert error:", e))

  // Redirect to destination with ref param
  const destination = new URL(link.destination_url)
  destination.searchParams.set("ref", code)

  return NextResponse.redirect(destination.toString())
}
