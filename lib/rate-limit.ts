// Simple in-memory sliding-window rate limit. State is per Vercel function
// instance; resets on cold start. Pair with Supabase Auth's own rate limits
// for the canonical guarantee — this layer just blunts trivial spam.
type Bucket = { hits: number[] };
const buckets = new Map<string, Bucket>();
const MAX_KEYS = 5000;

export function rateLimit(key: string, limit: number, windowMs: number): { ok: boolean; retryAfter: number } {
  const now = Date.now();
  let b = buckets.get(key);
  if (!b) {
    if (buckets.size >= MAX_KEYS) buckets.clear();
    b = { hits: [] };
    buckets.set(key, b);
  }
  b.hits = b.hits.filter((t) => now - t < windowMs);
  if (b.hits.length >= limit) {
    const oldest = b.hits[0];
    return { ok: false, retryAfter: Math.ceil((windowMs - (now - oldest)) / 1000) };
  }
  b.hits.push(now);
  return { ok: true, retryAfter: 0 };
}

export function clientIp(req: { headers: Headers }): string {
  const h = req.headers;
  return (
    h.get("x-real-ip") ??
    (h.get("x-forwarded-for") ?? "").split(",")[0].trim() ??
    h.get("cf-connecting-ip") ??
    "unknown"
  );
}
