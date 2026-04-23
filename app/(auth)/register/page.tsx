"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { useTranslation } from "@/lib/i18n/useTranslation"

export default function RegisterPage() {
  const { t } = useTranslation()
  const router = useRouter()
  const supabase = createClient()
  const [step, setStep] = useState<1 | 2>(1)
  const [fullName, setFullName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [phone, setPhone] = useState("")
  const [companyName, setCompanyName] = useState("")
  const [otp, setOtp] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [cooldown, setCooldown] = useState(0)

  useEffect(() => {
    if (cooldown <= 0) return
    const timer = setTimeout(() => setCooldown(cooldown - 1), 1000)
    return () => clearTimeout(timer)
  }, [cooldown])

  async function handleSendOtp(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError("")

    const res = await fetch("/api/auth/send-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, type: "register" }),
    })

    const data = await res.json()
    if (!res.ok) {
      setError(data.error)
      setLoading(false)
      return
    }

    setCooldown(60)
    setStep(2)
    setLoading(false)
  }

  async function handleVerifyAndRegister(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError("")

    // Verify OTP
    const verifyRes = await fetch("/api/auth/verify-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, code: otp, type: "register" }),
    })

    if (!verifyRes.ok) {
      const data = await verifyRes.json()
      setError(data.error)
      setLoading(false)
      return
    }

    // Register
    const registerRes = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, fullName, phone, companyName }),
    })

    const registerData = await registerRes.json()
    if (!registerRes.ok) {
      setError(registerData.error)
      setLoading(false)
      return
    }

    // Auto sign in after registration
    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password })
    if (signInError) {
      setError(signInError.message)
      setLoading(false)
      return
    }

    document.cookie = `session_started_at=${Date.now()}; path=/; max-age=${72 * 60 * 60}; SameSite=Lax`
    router.push("/")
    router.refresh()
  }

  async function handleResend() {
    if (cooldown > 0) return
    setError("")

    const res = await fetch("/api/auth/send-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, type: "register" }),
    })

    if (res.ok) {
      setCooldown(60)
    } else {
      const data = await res.json()
      setError(data.error)
    }
  }

  // Step 2: OTP verification
  if (step === 2) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 text-2xl font-bold text-primary font-heading">Stoaix</div>
            <CardTitle className="text-xl">{t("auth.register.step2Title")}</CardTitle>
            <CardDescription>{t("auth.register.step2Subtitle")}</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleVerifyAndRegister} className="space-y-4">
              {error && (
                <div className="p-3 text-sm text-red-600 bg-red-50 rounded-lg">{error}</div>
              )}
              <div className="space-y-2">
                <Input
                  type="text"
                  placeholder={t("auth.register.otpPlaceholder")}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  className="text-center text-2xl tracking-[0.5em] font-mono"
                  maxLength={6}
                  required
                />
              </div>
              <Button type="submit" className="w-full" disabled={loading || otp.length !== 6}>
                {loading ? t("auth.register.verifying") : t("auth.register.verify")}
              </Button>
              <div className="text-center">
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={cooldown > 0}
                  className="text-sm text-primary hover:underline disabled:text-muted-foreground disabled:no-underline"
                >
                  {cooldown > 0
                    ? t("auth.register.resendIn", { seconds: cooldown })
                    : t("auth.register.resendCode")}
                </button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Step 1: Form
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-8">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 text-2xl font-bold text-primary font-heading">Stoaix</div>
          <CardTitle className="text-xl">{t("auth.register.title")}</CardTitle>
          <CardDescription>{t("auth.register.subtitle")}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSendOtp} className="space-y-4">
            {error && (
              <div className="p-3 text-sm text-red-600 bg-red-50 rounded-lg">{error}</div>
            )}
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="fullName">{t("auth.register.fullName")}</label>
              <Input
                id="fullName"
                placeholder="John Doe"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="email">{t("auth.register.email")}</label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="password">{t("auth.register.password")}</label>
              <Input
                id="password"
                type="password"
                placeholder={t("auth.register.passwordPlaceholder")}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                minLength={8}
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="phone">{t("auth.register.phone")}</label>
              <Input
                id="phone"
                type="tel"
                placeholder="+1 (555) 000-0000"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="company">{t("auth.register.company")}</label>
              <Input
                id="company"
                placeholder="Your company name"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? t("auth.register.loading") : t("auth.register.submit")}
            </Button>
          </form>
          <p className="mt-4 text-center text-sm text-muted-foreground">
            {t("auth.register.hasAccount")}{" "}
            <Link href="/login" className="text-primary hover:underline">
              {t("auth.register.login")}
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
