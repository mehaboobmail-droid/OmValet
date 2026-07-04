# Om Valet — Premium Car Management

Production rebuild of the luxury valet parking system (staff check-in, guest
OTP retrieval, admin dashboard, shift scheduling). Wire-compatible with the
legacy Firebase Realtime Database — no data migration required.

## Stack

Next.js (App Router) · React · TypeScript strict · Tailwind CSS v4 ·
Framer Motion · Firebase (Auth + RTDB + Admin SDK) · Zod · Zustand · Netlify

## Getting started

```bash
npm install
npm run dev        # http://localhost:3000
npm run typecheck  # strict TS check
npm run lint       # ESLint
npm run build      # production build
```

Copy `.env.example` to `.env.local` and fill in the values. Server-only vars
(`FIREBASE_SERVICE_ACCOUNT`, `FAST2SMS_API_KEY`, `GUEST_TOKEN_SECRET`) enable
SMS, staff management and the guest flow's hardened path.

**Deploying?** Follow [DEPLOYMENT.md](DEPLOYMENT.md) — it sequences env vars,
verification, and the database-rules cutover safely.

## Structure

```
src/
  app/          Next.js routes (login, portal, guest, api)
  components/   ui/ (design-system kit) · brand/ · feature components
  firebase/     client.ts (browser SDK) · admin.ts (server SDK) · paths.ts
  hooks/        client state (toasts, auth, realtime subscriptions)
  services/     business logic (check-in, checkout, reports, sms)
  types/        domain model + zod schemas (mirrors the RTDB schema)
  utils/        date (IST-aware) · slots · otp · cn
  constants/    business constants
database.rules.json   Hardened RTDB rules (deployed in the final milestone)
```

## Design system

Black & gold luxury theme defined as Tailwind v4 tokens in
`src/app/globals.css` — `bg-obsidian`, `bg-surface-1..3`, `border-edge`,
`text-gold`, `text-ink(-muted|-dim)`, `shadow-card/gold/modal`,
`ease-luxe/spring`, `font-serif` (Cormorant Garamond), `font-mono` (DM Mono).
