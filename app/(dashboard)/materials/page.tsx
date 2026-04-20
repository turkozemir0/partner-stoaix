"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Download, FileText, Image, Video } from "lucide-react"
import { useTranslation } from "@/lib/i18n/useTranslation"

const materials = [
  { id: "1", key: "overview", type: "pdf", icon: FileText, url: "#" },
  { id: "2", key: "banners", type: "image", icon: Image, url: "#" },
  { id: "3", key: "emails", type: "pdf", icon: FileText, url: "#" },
  { id: "4", key: "demo", type: "video", icon: Video, url: "#" },
  { id: "5", key: "caseStudy", type: "pdf", icon: FileText, url: "#" },
  { id: "6", key: "playbook", type: "pdf", icon: FileText, url: "#" },
]

const typeColors: Record<string, string> = {
  pdf: "bg-red-100 text-red-800",
  image: "bg-blue-100 text-blue-800",
  video: "bg-purple-100 text-purple-800",
}

export default function MaterialsPage() {
  const { t } = useTranslation()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold font-heading">{t("materials.title")}</h1>
        <p className="text-muted-foreground text-sm">{t("materials.subtitle")}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {materials.map((material) => (
          <Card key={material.id} className="flex flex-col">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="h-10 w-10 rounded-lg bg-gray-100 flex items-center justify-center">
                  <material.icon className="h-5 w-5 text-muted-foreground" />
                </div>
                <Badge className={typeColors[material.type]}>{material.type.toUpperCase()}</Badge>
              </div>
              <CardTitle className="text-sm mt-3">{t(`materials.items.${material.key}.title`)}</CardTitle>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col justify-between">
              <p className="text-xs text-muted-foreground mb-4">{t(`materials.items.${material.key}.description`)}</p>
              <Button variant="outline" size="sm" className="w-full">
                <Download className="h-4 w-4 mr-2" />
                {t("materials.download")}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
