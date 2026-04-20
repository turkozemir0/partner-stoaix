import { NextRequest, NextResponse } from "next/server"
import { createServiceRoleClient } from "@/lib/supabase/server"

/**
 * Monthly commission calculation endpoint.
 * Should be triggered by Vercel Cron or an external scheduler on the 1st of each month.
 *
 * Vercel cron config goes in vercel.json:
 * { "crons": [{ "path": "/api/cron/monthly-commission", "schedule": "0 2 1 * *" }] }
 */
export async function GET(request: NextRequest) {
  // Verify cron secret (Vercel sends this header for cron jobs)
  const authHeader = request.headers.get("authorization")
  const cronSecret = request.headers.get("x-vercel-cron") // Vercel auto-sends this

  if (!cronSecret && authHeader !== `Bearer ${process.env.CRON_SECRET || process.env.WEBHOOK_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const supabase = createServiceRoleClient()

  // Current period = 1st of current month
  const now = new Date()
  const period = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split("T")[0]

  // Get all active partners
  const { data: partners } = await supabase
    .from("partners")
    .select("id")
    .eq("status", "active")

  if (!partners || partners.length === 0) {
    return NextResponse.json({ message: "No active partners", processed: 0 })
  }

  let processed = 0
  const errors: string[] = []

  for (const partner of partners) {
    try {
      await supabase.rpc("calculate_monthly_commission", {
        p_partner_id: partner.id,
        p_period: period,
      })
      processed++
    } catch (err: any) {
      errors.push(`${partner.id}: ${err.message}`)
    }
  }

  return NextResponse.json({
    success: true,
    period,
    processed,
    total: partners.length,
    errors: errors.length > 0 ? errors : undefined,
  })
}
