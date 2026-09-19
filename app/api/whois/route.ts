import { NextResponse } from "next/server";
import { lookupWhois } from "@/lib/server/whois";
import { checkRateLimit } from "@/lib/server/rateLimit";

export async function GET(request: Request) {
  const { allowed, applyCookie } = checkRateLimit(request, "whois", 20, 60_000);
  if (!allowed) {
    return applyCookie(
      NextResponse.json(
        { error: "Too many requests. Please wait a minute and try again." },
        { status: 429 },
      ),
    );
  }

  const { searchParams } = new URL(request.url);
  const target = searchParams.get("target") ?? "";

  const result = await lookupWhois(target);
  if ("error" in result) {
    return applyCookie(NextResponse.json({ error: result.error }, { status: 200 }));
  }
  return applyCookie(NextResponse.json(result));
}
