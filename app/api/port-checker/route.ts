import { NextResponse } from "next/server";
import { checkPort } from "@/lib/server/portChecker";
import { checkRateLimit } from "@/lib/server/rateLimit";

export async function GET(request: Request) {
  // Strictest limit on the site: this is the tool most easily abused for
  // scanning, so 10/minute per client regardless of what the check itself does.
  const { allowed, applyCookie } = checkRateLimit(request, "port-checker", 10, 60_000);
  if (!allowed) {
    return applyCookie(
      NextResponse.json(
        { error: "Too many requests. Please wait a minute and try again." },
        { status: 429 },
      ),
    );
  }

  const { searchParams } = new URL(request.url);
  const host = searchParams.get("host") ?? "";
  const portParam = searchParams.get("port") ?? "";
  const port = Number(portParam);

  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    return applyCookie(
      NextResponse.json(
        { error: "Enter a valid port number (1-65535)." },
        { status: 200 },
      ),
    );
  }

  const result = await checkPort(host, port);
  if ("error" in result) {
    return applyCookie(NextResponse.json({ error: result.error }, { status: 200 }));
  }
  return applyCookie(NextResponse.json(result));
}
