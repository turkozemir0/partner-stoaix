"use client"

import { useTranslation } from "@/lib/i18n/useTranslation"

export function LanguageSwitcher() {
  const { language, setLanguage } = useTranslation()

  return (
    <div className="flex items-center rounded-lg border bg-gray-50 p-0.5">
      <button
        onClick={() => setLanguage("tr")}
        className={`px-2 py-1 text-xs font-medium rounded-md transition-colors ${
          language === "tr"
            ? "bg-white text-foreground shadow-sm"
            : "text-muted-foreground hover:text-foreground"
        }`}
      >
        TR
      </button>
      <button
        onClick={() => setLanguage("en")}
        className={`px-2 py-1 text-xs font-medium rounded-md transition-colors ${
          language === "en"
            ? "bg-white text-foreground shadow-sm"
            : "text-muted-foreground hover:text-foreground"
        }`}
      >
        EN
      </button>
    </div>
  )
}
