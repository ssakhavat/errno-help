import { ipAddress } from "@vercel/functions";

interface Bucket {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, Bucket>();

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
}

function pruneExpired(now: number): void {
  for (const [key, bucket] of buckets) {
    if (now >= bucket.resetAt) buckets.delete(key);
  }
}

export function rateLimit(
  key: string,
  limit: number,
  windowMs: number,
): RateLimitResult {
  const now = Date.now();
  // Opportunistic cleanup so the in-memory map doesn't grow unbounded over
  // a long-running process; no need for a real background job at this scale.
  if (Math.random() < 0.01) pruneExpired(now);

  const existing = buckets.get(key);
  if (!existing || now >= existing.resetAt) {
    const resetAt = now + windowMs;
    buckets.set(key, { count: 1, resetAt });
    return { allowed: true, remaining: limit - 1, resetAt };
  }
  if (existing.count >= limit) {
    return { allowed: false, remaining: 0, resetAt: existing.resetAt };
  }
  existing.count += 1;
  return { allowed: true, remaining: limit - existing.count, resetAt: existing.resetAt };
}

const RATE_LIMIT_COOKIE = "rl_id";

function parseCookie(header: string | null, name: string): string | undefined {
  if (!header) return undefined;
  for (const part of header.split(";")) {
    const eq = part.indexOf("=");
    if (eq === -1) continue;
    if (part.slice(0, eq).trim() === name) {
      return decodeURIComponent(part.slice(eq + 1).trim());
    }
  }
  return undefined;
}

interface ClientIdentity {
  key: string;
  /** Set on the response when a new local-fallback identity was minted. */
  setCookie?: string;
}

// `VERCEL` is a platform-injected environment variable, not request data —
// a client can never set it, so it's safe to branch on.
const ON_VERCEL = process.env.VERCEL === "1";

function resolveClientIdentity(request: Request): ClientIdentity {
  if (ON_VERCEL) {
    // Vercel's edge proxy computes this itself from the TCP connection and
    // overwrites whatever the client sent, so — unlike a raw X-Forwarded-For
    // header on an unproxied server — it can't be spoofed by the caller.
    const ip = ipAddress(request);
    if (ip) return { key: `ip:${ip}` };
  }

  // No trustworthy proxy in front of this process: no request header can be
  // trusted, so there's no way to recognize a returning client on its
  // first request. Give it a random id in a cookie for next time, but rate
  // limit *this* request under one shared "anonymous" bucket rather than a
  // fresh one — otherwise ignoring the cookie (which any script does by
  // default) would mint a brand-new bucket on every request, exactly like
  // the header-spoofing bypass this replaced. A returning browser sends its
  // cookie back automatically and gets its own bucket from the second
  // request on, so real distinct users stop sharing a bucket with anyone
  // else almost immediately.
  const existing = parseCookie(request.headers.get("cookie"), RATE_LIMIT_COOKIE);
  if (existing) return { key: `local:${existing}` };

  const id = crypto.randomUUID();
  return {
    key: "local:anonymous",
    setCookie: `${RATE_LIMIT_COOKIE}=${id}; Path=/; Max-Age=2592000; HttpOnly; SameSite=Lax`,
  };
}

export interface RouteRateLimit {
  allowed: boolean;
  /** Attach the local-fallback identity cookie to whichever response is returned. */
  applyCookie: <T extends Response>(response: T) => T;
}

export function checkRateLimit(
  request: Request,
  routeName: string,
  limit: number,
  windowMs: number,
): RouteRateLimit {
  const identity = resolveClientIdentity(request);
  const result = rateLimit(`${routeName}:${identity.key}`, limit, windowMs);
  return {
    allowed: result.allowed,
    applyCookie: (response) => {
      if (identity.setCookie) {
        response.headers.append("Set-Cookie", identity.setCookie);
      }
      return response;
    },
  };
}
