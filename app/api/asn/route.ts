import { NextResponse } from "next/server";
import { lookupAsn } from "@/lib/server/asn";
import { checkRateLimit } from "@/lib/server/rateLimit";

export async function GET(request: Request) {
  const { allowed, applyCookie } = checkRateLimit(request, "asn", 20, 60_000);
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

  const result = await lookupAsn(target);
  if ("error" in result) {
    return applyCookie(NextResponse.json({ error: result.error }, { status: 200 }));
  }
  return applyCookie(NextResponse.json(result));
}
