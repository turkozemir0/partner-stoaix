# Stoaix Partner Panel

## Overview
Affiliate/partner panel for Stoaix. Partners refer clinics, earn recurring commissions.

## Tech Stack
- Next.js 14 (App Router) + TypeScript
- Supabase (separate project from main Stoaix)
- Tailwind CSS + shadcn/ui style components
- Recharts for charts
- Deploy: Vercel → partner.stoaix.com

## Project Structure
```
app/(auth)/        - Login/Register pages
app/(dashboard)/   - All authenticated pages
app/r/[code]/      - Referral link redirect handler
app/api/           - API routes (stats, links, payouts, webhook)
components/        - React components (layout, dashboard, links, ui)
lib/               - Supabase clients, types, utils
sql/               - Database schema
```

## Key Commands
```bash
npm run dev        # Start dev server
npm run build      # Production build
npm run lint       # ESLint
```

## Commission Tiers
- Starter: 10% (1-4 active clients)
- Growth: 20% (5-9 active clients)
- Pro: 30% (10+ active clients)

## Integration
- Main platform sends POST to /api/webhook/conversion when referral signup happens
- Webhook authenticated via Bearer token (WEBHOOK_SECRET)
