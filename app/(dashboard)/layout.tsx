"use client"

import { useEffect, useState } from "react"
import { Sidebar } from "@/components/layout/Sidebar"
import { Header } from "@/components/layout/Header"
import { createClient } from "@/lib/supabase/client"

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [partnerName, setPartnerName] = useState("")
  const supabase = createClient()

  useEffect(() => {
    async function fetchPartner() {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data } = await supabase
          .from("partners")
          .select("full_name")
          .eq("user_id", user.id)
          .single()
        if (data) setPartnerName(data.full_name)
      }
    }
    fetchPartner()
  }, [])

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar />
      <div className="md:pl-64">
        <Header partnerName={partnerName} />
        <main className="p-4 md:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  )
}
