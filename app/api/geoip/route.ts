import { NextResponse } from "next/server";
import { lookupGeoIp } from "@/lib/server/geoip";
import { checkRateLimit } from "@/lib/server/rateLimit";

export async function GET(request: Request) {
  // Backs onto a metered ipinfo.io account, so keep this tighter than the
  // free lookups (asn/dns/whois) even with the 24h result cache in front of it.
  const { allowed, applyCookie } = checkRateLimit(request, "geoip", 15, 60_000);
  if (!allowed) {
    return applyCookie(
      NextResponse.json(
        { error: "Too many requests. Please wait a minute and try again." },
        { status: 429 },
      ),
    );
  }

  const { searchParams } = new URL(request.url);
  const target = searchParams.get("ip") ?? "";

  const result = await lookupGeoIp(target);
  if ("error" in result) {
    return applyCookie(NextResponse.json({ error: result.error }, { status: 200 }));
  }
  return applyCookie(NextResponse.json(result));
}
