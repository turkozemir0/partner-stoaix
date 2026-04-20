import { NextResponse } from "next/server"

const materials = [
  {
    id: "1",
    title: "Stoaix Product Overview",
    description: "One-pager explaining Stoaix's value proposition for clinics",
    type: "pdf",
    url: "/materials/stoaix-overview.pdf",
  },
  {
    id: "2",
    title: "Social Media Banner Pack",
    description: "Ready-to-use banners for LinkedIn, Twitter, and Facebook",
    type: "image",
    url: "/materials/banners.zip",
  },
  {
    id: "3",
    title: "Email Templates",
    description: "Cold outreach and follow-up email templates",
    type: "pdf",
    url: "/materials/email-templates.pdf",
  },
  {
    id: "4",
    title: "Product Demo Video",
    description: "3-minute video showcasing Stoaix's key features",
    type: "video",
    url: "/materials/demo.mp4",
  },
  {
    id: "5",
    title: "Case Study: Dr. Müller Clinic",
    description: "How a hair transplant clinic increased efficiency by 40%",
    type: "pdf",
    url: "/materials/case-study.pdf",
  },
  {
    id: "6",
    title: "Partner Sales Playbook",
    description: "Complete guide to selling Stoaix to clinics",
    type: "pdf",
    url: "/materials/sales-playbook.pdf",
  },
]

export async function GET() {
  return NextResponse.json(materials)
}
