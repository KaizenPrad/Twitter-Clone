# 🛡 Twitter-Clone + CyberSentinel Integration

This app pushes security-relevant events to **CyberSentinel** (`POST /api/ingest`).
Sentinel scores 0–100 → correlates 2–3 signals → Detection → auto-Incident.

## 1. What was wired

| App event | Sentinel `signalType` | `category` / `severity` | Where |
|---|---|---|---|
| Failed logins x3+/min (same IP+username) | `BRUTE_FORCE_BURST` | AUTH / HIGH | `backend/controllers/auth.controller.js` → `login` |
| Off-hours login success (1–5am) | `OFF_HOURS_LOGIN` | AUTH / MEDIUM | `auth.controller.js` → `login` |
| New signup | `NEW_ACCOUNT` | AUTH / INFO | `auth.controller.js` → `signup` |
| Post/comment with plain link | `PHISH_CLICK` | WEB / MEDIUM | `post.controller.js` → `createPost`, `commentOnPost` |
| Post/comment with credential-harvesting link (verify/suspended/urgent/password/bank/… keywords) | `PHISH_CLICK` + `CREDENTIAL_FORM_POST` in ONE batch → PHISHING detection ~60 | WEB / HIGH | `post.controller.js` (pair passes Sentinel's ≥2-signals / ≥55 rule) |
| First-seen domain in post | `SUSPICIOUS_DNS` | NETWORK / MEDIUM | `post.controller.js` → `createPost` |
| 5+ posts/min (spam) | `BEACONING` | NETWORK / MEDIUM | `post.controller.js` |
| 10+ likes/min (bot) | `BEACONING` | NETWORK / MEDIUM | `post.controller.js` → `likeUnlikePost` |
| 8+ follows/min (bot) | `BEACONING` | NETWORK / MEDIUM | `user.controller.js` → `followUnfollowUser` |
| Password change | `PRIV_ESCALATION` | AUTH / MEDIUM | `user.controller.js` → `updateUser` |

Helper: `backend/lib/sentinel.js` (`reportToSentinel`, fire-and-forget, 3s timeout, never blocks).
Disabled safely when `SENTINEL_URL` / `SENTINEL_API_KEY` are missing.

## 2. Setup (local, 2 terminals)

> ✅ Verified 03-Oct-2026: `SENTINEL_URL=http://localhost:5000` + your
> `cs_live_...` key returns `201`, and a 3-signal phishing batch returns
> `{ processed: 3, detectionsTriggered: 1, incidentsCreated: 1 }`.

⚠️ Port clash: Sentinel (5000) and this app (5000) can't share one port.
Pick one option:

Option A — Twitter on 8000, Sentinel stays 5000:
```bash
# Terminal A — Sentinel (already running?)
cd D:\Cyber\backend
npm run dev   # → http://localhost:5000/api/health
```
```bash
# Terminal B — Twitter-Clone on 8000
cd "D:\Twitter Clone\Twitter-Clone\backend"
copy .env.example .env   # then edit:
# PORT=8000
# SENTINEL_URL=http://localhost:5000
# SENTINEL_API_KEY=cs_live_...   (your key)
set PORT=8000 && npm run dev
```

Option B — Sentinel on 5001 (same DB, key still valid), Twitter stays 5000:
```bash
cd D:\Cyber\backend
set PORT=5001 && npm run dev
# then in twitter .env: SENTINEL_URL=http://localhost:5001
```

> ⚠️ The `cs_live_...` key only works against the Sentinel backend + database
> where it was created. If ingest returns `401 Invalid API key`, create a fresh
> key on the Sentinel you are actually running (see §3).

## 3. Fresh API key (if 401)

```bash
# 1. login as owner on THAT sentinel
curl -X POST http://localhost:5001/api/auth/login -H "Content-Type: application/json" -d "{\"email\":\"owner@x.com\",\"password\":\"...\"}"
# 2. create key
curl -X POST http://localhost:5001/api/auth/api-keys -H "Authorization: Bearer <JWT>" -H "Content-Type: application/json" -d "{\"name\":\"twitter-clone\",\"expiresInDays\":365}"
# 3. put returned key into twitter backend .env as SENTINEL_API_KEY
```

## 4. Test end-to-end (5 min)

```bash
# a. direct ingest test (proves URL+key work)
curl -X POST http://localhost:5001/api/ingest -H "Authorization: Bearer cs_live_YOURKEY" -H "Content-Type: application/json" -d "{\"signals\":[{\"signalType\":\"PHISH_CLICK\",\"category\":\"WEB\",\"severity\":\"MEDIUM\",\"message\":\"test link\",\"userIdentity\":\"tester@x.com\",\"eventTimestamp\":\"2026-10-03T10:00:00Z\",\"rawData\":{}}]}"
# → { processed: 1, ... }

# b. app-driven test
# 1. fail login 4x with wrong password  → BRUTE_FORCE_BURST in Sentinel Monitor
# 2. create post: "claim reward http://xn--paypa1.com/login" → PHISH_CLICK(HIGH)+SUSPICIOUS_DNS → Detection PHISHING ~85 → auto-Incident
# 3. open Sentinel UI → Monitor / Detection / Incidents / Graph / Report
```

## 5. Deploy notes

- Set `SENTINEL_URL` + `SENTINEL_API_KEY` in your host (Render/Railway/Vercel env dashboard), never commit `.env`.
- Sentinel downtime never breaks this app (fire-and-forget + try/catch everywhere).
- Keep `rawData` small; never send passwords/tokens (we don't).
