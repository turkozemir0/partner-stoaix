"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { useTranslation } from "@/lib/i18n/useTranslation"

export default function ForgotPasswordPage() {
  const { t } = useTranslation()
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1)
  const [email, setEmail] = useState("")
  const [otp, setOtp] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
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
      body: JSON.stringify({ email, type: "reset" }),
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

  async function handleVerifyOtp(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError("")

    const res = await fetch("/api/auth/verify-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, code: otp, type: "reset" }),
    })

    if (!res.ok) {
      const data = await res.json()
      setError(data.error)
      setLoading(false)
      return
    }

    setStep(3)
    setLoading(false)
  }

  async function handleResetPassword(e: React.FormEvent) {
    e.preventDefault()
    setError("")

    if (newPassword !== confirmPassword) {
      setError(t("auth.forgotPassword.passwordMismatch"))
      return
    }

    setLoading(true)

    const res = await fetch("/api/auth/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, newPassword }),
    })

    const data = await res.json()
    if (!res.ok) {
      setError(data.error)
      setLoading(false)
      return
    }

    setStep(4)
    setLoading(false)
  }

  async function handleResend() {
    if (cooldown > 0) return
    setError("")

    const res = await fetch("/api/auth/send-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, type: "reset" }),
    })

    if (res.ok) {
      setCooldown(60)
    } else {
      const data = await res.json()
      setError(data.error)
    }
  }

  // Step 4: Success
  if (step === 4) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-xl">{t("auth.forgotPassword.successTitle")}</CardTitle>
            <CardDescription>{t("auth.forgotPassword.successMessage")}</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/login">
              <Button className="w-full">{t("auth.forgotPassword.backToLogin")}</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Step 3: New password
  if (step === 3) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 text-2xl font-bold text-primary font-heading">Stoaix</div>
            <CardTitle className="text-xl">{t("auth.forgotPassword.step3Title")}</CardTitle>
            <CardDescription>{t("auth.forgotPassword.step3Subtitle")}</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleResetPassword} className="space-y-4">
              {error && (
                <div className="p-3 text-sm text-red-600 bg-red-50 rounded-lg">{error}</div>
              )}
              <div className="space-y-2">
                <label className="text-sm font-medium">{t("auth.forgotPassword.newPassword")}</label>
                <Input
                  type="password"
                  placeholder="Min. 8 characters"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  minLength={8}
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">{t("auth.forgotPassword.confirmPassword")}</label>
                <Input
                  type="password"
                  placeholder="Min. 8 characters"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  minLength={8}
                  required
                />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? t("auth.forgotPassword.resetting") : t("auth.forgotPassword.resetPassword")}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Step 2: OTP verification
  if (step === 2) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 text-2xl font-bold text-primary font-heading">Stoaix</div>
            <CardTitle className="text-xl">{t("auth.forgotPassword.step2Title")}</CardTitle>
            <CardDescription>{t("auth.forgotPassword.step2Subtitle")}</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              {error && (
                <div className="p-3 text-sm text-red-600 bg-red-50 rounded-lg">{error}</div>
              )}
              <div className="space-y-2">
                <Input
                  type="text"
                  placeholder={t("auth.forgotPassword.otpPlaceholder")}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  className="text-center text-2xl tracking-[0.5em] font-mono"
                  maxLength={6}
                  required
                />
              </div>
              <Button type="submit" className="w-full" disabled={loading || otp.length !== 6}>
                {loading ? t("auth.forgotPassword.verifying") : t("auth.forgotPassword.verify")}
              </Button>
              <div className="text-center">
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={cooldown > 0}
                  className="text-sm text-primary hover:underline disabled:text-muted-foreground disabled:no-underline"
                >
                  {cooldown > 0
                    ? t("auth.forgotPassword.resendIn", { seconds: cooldown })
                    : t("auth.forgotPassword.resendCode")}
                </button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Step 1: Email input
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 text-2xl font-bold text-primary font-heading">Stoaix</div>
          <CardTitle className="text-xl">{t("auth.forgotPassword.title")}</CardTitle>
          <CardDescription>{t("auth.forgotPassword.subtitle")}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSendOtp} className="space-y-4">
            {error && (
              <div className="p-3 text-sm text-red-600 bg-red-50 rounded-lg">{error}</div>
            )}
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="email">{t("auth.forgotPassword.email")}</label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? t("auth.forgotPassword.sending") : t("auth.forgotPassword.sendCode")}
            </Button>
          </form>
          <p className="mt-4 text-center text-sm text-muted-foreground">
            <Link href="/login" className="text-primary hover:underline">
              {t("auth.forgotPassword.backToLogin")}
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
