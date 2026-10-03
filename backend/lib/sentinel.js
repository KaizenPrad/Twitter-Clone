// CyberSentinel integration helper for Twitter-Clone backend.
// Fire-and-forget: never blocks user requests, never throws.
// Env: SENTINEL_URL (e.g. http://localhost:5001), SENTINEL_API_KEY (cs_live_...)

const SENTINEL_URL = (process.env.SENTINEL_URL || "").replace(/\/$/, "");
const SENTINEL_API_KEY = process.env.SENTINEL_API_KEY || process.env.SENTINEL_TOKEN || "";

export const now = () => new Date().toISOString();

export function isSentinelEnabled() {
  return Boolean(SENTINEL_URL && SENTINEL_API_KEY);
}

function clientIp(req) {
  return (
    req?.headers?.["x-forwarded-for"]?.split(",")[0]?.trim() ||
    req?.ip ||
    req?.socket?.remoteAddress ||
    "unknown"
  );
}

export function extractDomain(text = "") {
  const m = String(text).match(/https?:\/\/([^\s/)"']+)/i) || String(text).match(/(?:^|\s)([a-z0-9-]+\.[a-z]{2,})(?:\/|\s|$)/i);
  if (!m) return undefined;
  return (m[1] || "").toLowerCase().replace(/^www\./, "").slice(0, 253) || undefined;
}

export function containsLink(text = "") {
  return /https?:\/\/|www\.|[a-z0-9-]+\.(com|net|org|io|xyz|top|ru|tk|ml|ga|cf|gq|pw|cc|icu|buzz|shop|site|online)\b/i.test(String(text));
}

const PHISH_KEYWORDS = ["verify", "suspended", "urgent", "password", "bank", "wallet", "free crypto", "airdrop", "login here", "claim reward", "xn--"];
export function looksPhishy(text = "") {
  const t = String(text).toLowerCase();
  return PHISH_KEYWORDS.some((k) => t.includes(k));
}

// Core sender — never throws, 3s timeout, no await needed by callers.
export function reportToSentinel(signals) {
  if (!isSentinelEnabled()) return Promise.resolve({ skipped: true });
  if (!Array.isArray(signals) || signals.length === 0) return Promise.resolve({ skipped: true });
  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 3000);
    return fetch(`${SENTINEL_URL}/api/ingest`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${SENTINEL_API_KEY}`,
      },
      body: JSON.stringify({ signals }),
      signal: ctrl.signal,
    })
      .then(async (r) => {
        clearTimeout(timer);
        if (!r.ok) {
          const t = await r.text().catch(() => "");
          console.warn(`[sentinel] ingest ${r.status}: ${t.slice(0, 200)}`);
        }
        return r;
      })
      .catch((e) => {
        clearTimeout(timer);
        console.warn(`[sentinel] ingest failed (non-blocking): ${e?.message || e}`);
      });
  } catch (e) {
    console.warn(`[sentinel] ingest setup failed: ${e?.message || e}`);
    return Promise.resolve({ skipped: true });
  }
}

// Small in-memory rate tracker (per key). Resets on restart — fine for brute-force / spam heuristics.
const hits = new Map(); // key -> { count, firstAt }
export function burstCount(key, windowMs = 60_000) {
  const cur = hits.get(key);
  const t = Date.now();
  if (!cur || t - cur.firstAt > windowMs) {
    hits.set(key, { count: 1, firstAt: t });
    return 1;
  }
  cur.count += 1;
  return cur.count;
}

export function isOffHours(date = new Date()) {
  const h = date.getHours();
  return h >= 1 && h <= 5; // 1am–5am local server time
}

export { SENTINEL_URL, clientIp };
