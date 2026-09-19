import { isIP } from "node:net";

export interface GeoIpError {
  error: string;
}

export interface GeoIpResult {
  ip: string;
  country?: string;
  city?: string;
  region?: string;
  latitude?: number;
  longitude?: number;
  org?: string;
  timeZone?: string;
}

// Same reasoning as lib/server/portChecker.ts: ipinfo has no data for these
// ranges anyway, so reject them before spending a metered API call on them.
function isPrivateOrReservedIp(ip: string): boolean {
  const version = isIP(ip);
  if (version === 4) {
    const parts = ip.split(".").map(Number);
    const [a, b] = parts;
    if (a === 10) return true;
    if (a === 127) return true;
    if (a === 0) return true;
    if (a === 169 && b === 254) return true;
    if (a === 172 && b >= 16 && b <= 31) return true;
    if (a === 192 && b === 168) return true;
    if (a === 100 && b >= 64 && b <= 127) return true; // CGNAT
    if (a >= 224) return true; // multicast/reserved
    return false;
  }
  if (version === 6) {
    const lower = ip.toLowerCase();
    if (lower === "::1") return true;
    if (lower.startsWith("fe80:")) return true; // link-local
    if (lower.startsWith("fc") || lower.startsWith("fd")) return true; // ULA
    if (lower.startsWith("::ffff:")) {
      const embedded = lower.split(":").pop() ?? "";
      if (embedded.includes(".")) return isPrivateOrReservedIp(embedded);
    }
    return false;
  }
  return true; // not a parseable IP at all — treat as unsafe
}

interface CacheEntry {
  value: GeoIpResult | GeoIpError;
  expiresAt: number;
}

// City-level GeoIP data barely changes day to day; caching keeps repeat
// lookups (and abuse) from burning the metered ipinfo.io query quota (§17, §22).
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;
const cache = new Map<string, CacheEntry>();

function pruneExpired(now: number): void {
  for (const [key, entry] of cache) {
    if (now >= entry.expiresAt) cache.delete(key);
  }
}

function messageForStatus(status: number): string {
  switch (status) {
    case 401:
    case 403:
      return "The GeoIP service rejected our credentials. Check the server configuration.";
    case 404:
      return "That doesn't look like a valid IP address.";
    case 429:
      return "The GeoIP service is rate-limiting us right now. Try again shortly.";
    default:
      return "The GeoIP service returned an unexpected error.";
  }
}

export async function lookupGeoIp(target: string): Promise<GeoIpResult | GeoIpError> {
  const trimmed = target.trim();
  if (!trimmed) {
    return { error: "Enter an IPv4 or IPv6 address." };
  }
  if (!isIP(trimmed)) {
    return { error: `"${target}" is not a valid IP address.` };
  }
  if (isPrivateOrReservedIp(trimmed)) {
    return { error: "That address is private or reserved and has no GeoIP data." };
  }

  const now = Date.now();
  if (Math.random() < 0.05) pruneExpired(now);

  const cached = cache.get(trimmed);
  if (cached && now < cached.expiresAt) {
    return cached.value;
  }

  const token = process.env.IPINFO_TOKEN;
  if (!token) {
    return { error: "GeoIP lookups are not configured on this server." };
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 6000);

  let response: Response;
  try {
    response = await fetch(
      `https://ipinfo.io/${encodeURIComponent(trimmed)}/json?token=${encodeURIComponent(token)}`,
      {
        headers: { Accept: "application/json" },
        signal: controller.signal,
      },
    );
  } catch (err) {
    clearTimeout(timeout);
    if ((err as Error).name === "AbortError") {
      return { error: "The GeoIP lookup timed out." };
    }
    return { error: "Could not reach the GeoIP service." };
  }
  clearTimeout(timeout);

  if (!response.ok) {
    const result: GeoIpError = { error: messageForStatus(response.status) };
    // Not-found is stable per address, worth caching; auth/quota failures
    // are transient server-side conditions, so don't cache those.
    if (response.status === 404) {
      cache.set(trimmed, { value: result, expiresAt: now + CACHE_TTL_MS });
    }
    return result;
  }

  const data = await response.json();

  // ipinfo flags addresses from bogon (private/reserved) ranges instead of
  // erroring — our own pre-check above should already catch these, but stay
  // defensive in case a range isn't in our list.
  if (data.bogon) {
    const result: GeoIpError = { error: "That address is private or reserved and has no GeoIP data." };
    cache.set(trimmed, { value: result, expiresAt: now + CACHE_TTL_MS });
    return result;
  }

  const [latitude, longitude] = typeof data.loc === "string" ? data.loc.split(",").map(Number) : [];
  const result: GeoIpResult = {
    ip: trimmed,
    country: data.country,
    city: data.city,
    region: data.region,
    latitude: Number.isFinite(latitude) ? latitude : undefined,
    longitude: Number.isFinite(longitude) ? longitude : undefined,
    org: data.org,
    timeZone: data.timezone,
  };

  cache.set(trimmed, { value: result, expiresAt: now + CACHE_TTL_MS });
  return result;
}
