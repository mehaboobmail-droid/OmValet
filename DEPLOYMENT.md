# Deployment Runbook — Om Valet

The app now targets the fresh **`wallet-parking`** Firebase project
(asia-southeast1). It was bootstrapped on 2026-07-04:

- ✅ Hardened [`database.rules.json`](database.rules.json) **already deployed** —
  the database has been locked-down from day one (no public reads/writes,
  admin-gated staff/shift/config writes).
- ✅ `meta` seeded: ticket counter at 1000 (first ticket = V-1001),
  checked-out counter 0, default A–D × 10 parking grid.
- ✅ Bootstrap admin account created for `mehaboobmail@gmail.com`
  (**rotate its password immediately** — change it via the staff Edit modal
  or Firebase Console → Authentication).

### Creating the first admin on a brand-new project

This portal has **no public sign-up** (by design — staff-only, like the
legacy app). The first admin is provisioned out-of-band with the Admin SDK:

```bash
npm run bootstrap:admin -- your-admin@example.com "a-strong-password"
```

It reads `FIREBASE_SERVICE_ACCOUNT` + `NEXT_PUBLIC_FIREBASE_DATABASE_URL`
from `.env.local`, is idempotent, and creates the Auth user, the
`admins/{uid}` flag, and the `valets/{uid}` profile. Every account after that
is created in-app via Admin → Create Valet Account. A user who authenticates
but has no staff profile is shown "Access Not Authorized" and cannot enter
the portal.

The legacy `valet-7bf14` project is untouched and serves as the archive of
old history/reports. This is a clean break: staff accounts and historical
data do **not** carry over (say the word if you want a one-off migration
script for `history`/`activity`).

---

## Phase 0 — Remaining credentials

1. **Fast2SMS**: rotate the old key (it was committed to the legacy repo),
   then keep the new key only in env vars. SMS is the single untested
   integration — everything else has been verified end-to-end.
2. **Production guest-token secret**: generate a fresh one (do not reuse the
   dev value from `.env.local`):
   ```bash
   python -c "import secrets; print(secrets.token_hex(32))"
   ```

## Phase 1 — Netlify site + environment

Create the site from this repo (build config comes from `netlify.toml`).
Environment variables — copy the `NEXT_PUBLIC_*` values from `.env.local`
(they are the public wallet-parking web config), plus:

| Variable | Value |
|---|---|
| `NEXT_PUBLIC_FIREBASE_*` (7 vars) | As in `.env.local` (wallet-parking web config) |
| `NEXT_PUBLIC_APP_URL` | `https://<your-site>.netlify.app` — used in guest SMS links |
| `FIREBASE_SERVICE_ACCOUNT` | The single-line JSON from `.env.local` (already repaired/validated) |
| `FAST2SMS_API_KEY` | The **new** rotated key |
| `GUEST_TOKEN_SECRET` | Fresh production value from Phase 0 |

Notes:
- The wallet-parking web API key is HTTP-referrer-restricted — add your
  production domain to its allowed referrers (Google Cloud Console → APIs &
  Services → Credentials) alongside `localhost:3000`.
- The scheduled `shift-alert` function (daily 08:00 IST valet reminders)
  activates automatically from `netlify.toml`.

## Phase 2 — Verify on the deployed URL

- [ ] Sign in as the admin; **change the bootstrap password**
- [ ] Create your real valet accounts (Admin → Create Valet Account)
- [ ] Check a test car in — **SMS arrives** (first live SMS test)
- [ ] Open the guest link from the SMS: OTP → request now → mark ready →
      guest screen flips to "Your Car is Ready!"
- [ ] Check out — record appears in the admin report; CSV downloads
- [ ] Create + delete a throwaway valet — deleted login must fail to sign in
- [ ] Create shift types, assign a valet with a phone — confirmation SMS arrives
- [ ] Print a ticket — print preview shows only the white slip

## Phase 3 — Go live

Point staff at the new URL. Old-style links (`/guest.html`, `/portal.html`,
`/index.html`, `/login.html`) already redirect via `netlify.toml` if you
reuse the legacy domain. Decommission the legacy Netlify site when ready —
its `update-status` function is an unauthenticated writer against the old
project and should not stay up.

## Rollback

Netlify → Deploys → *Publish* a previous deploy. Database rules for
wallet-parking are versioned in Firebase Console → Realtime Database →
Rules (history tab) if a rules change is ever suspect.
