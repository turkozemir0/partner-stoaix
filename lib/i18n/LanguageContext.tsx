"use client"

import { createContext, useContext, useState, useEffect, ReactNode } from "react"
import tr from "./locales/tr.json"
import en from "./locales/en.json"

type Language = "tr" | "en"

const locales: Record<Language, Record<string, any>> = { tr, en }

interface LanguageContextType {
  language: Language
  setLanguage: (lang: Language) => void
  t: (key: string, params?: Record<string, string | number>) => string
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

function getNestedValue(obj: any, path: string): string {
  const value = path.split(".").reduce((acc, part) => acc?.[part], obj)
  return typeof value === "string" ? value : path
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>("tr")

  useEffect(() => {
    const saved = localStorage.getItem("lang") as Language | null
    if (saved && (saved === "tr" || saved === "en")) {
      setLanguageState(saved)
    }
  }, [])

  function setLanguage(lang: Language) {
    setLanguageState(lang)
    localStorage.setItem("lang", lang)
  }

  function t(key: string, params?: Record<string, string | number>): string {
    let value = getNestedValue(locales[language], key)
    if (params) {
      Object.entries(params).forEach(([k, v]) => {
        value = value.replace(`{${k}}`, String(v))
      })
    }
    return value
  }

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguageContext() {
  const context = useContext(LanguageContext)
  if (!context) {
    throw new Error("useLanguageContext must be used within a LanguageProvider")
  }
  return context
}
