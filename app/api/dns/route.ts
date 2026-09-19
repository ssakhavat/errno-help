import { NextResponse } from "next/server";
import { lookupDns } from "@/lib/server/dns";
import { DNS_RECORD_TYPES, isDnsRecordType } from "@/lib/dnsTypes";
import { checkRateLimit } from "@/lib/server/rateLimit";

export async function GET(request: Request) {
  const { allowed, applyCookie } = checkRateLimit(request, "dns", 30, 60_000);
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
  const type = (searchParams.get("type") ?? "A").toUpperCase();

  if (!isDnsRecordType(type)) {
    return applyCookie(
      NextResponse.json(
        { error: `Unsupported record type. Use one of: ${DNS_RECORD_TYPES.join(", ")}.` },
        { status: 400 },
      ),
    );
  }

  const result = await lookupDns(domain, type);
  if ("error" in result) {
    return applyCookie(NextResponse.json({ error: result.error }, { status: 200 }));
  }
  return applyCookie(NextResponse.json({ records: result }));
}
