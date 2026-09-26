import { NextResponse } from "next/server";
import { getDomainHealth } from "@/lib/server/domainHealth";
import { checkRateLimit } from "@/lib/server/rateLimit";

export async function GET(request: Request) {
  // Fans out into ~11 sub-lookups per call (6 DNS record types + WHOIS +
  // ASN + GeoIP + 5 port checks) — the strictest limit on the site.
  const { allowed, applyCookie } = checkRateLimit(request, "domain-health", 5, 60_000);
  if (!allowed) {
    return applyCookie(
      NextResponse.json(
        { error: "Too many requests. Please wait a minute and try again." },
        { status: 429 },
      ),
    );
  }

  const { searchParams } = new URL(request.url);
  const domain = searchParams.get("domain") ?? "";

  const result = await getDomainHealth(domain);
  if ("error" in result) {
    return applyCookie(NextResponse.json({ error: result.error }, { status: 200 }));
  }
  return applyCookie(NextResponse.json(result));
}
