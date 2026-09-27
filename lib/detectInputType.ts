import { decodeJwt, isJwtError } from "@/lib/jwt";

export type DetectedTool = "cidr" | "jwt" | "windows-errors";

const CIDR_RE = /^\d{1,3}(\.\d{1,3}){3}\/\d{1,2}$/;
const HEX_RE = /^0x[0-9a-fA-F]+$/i;
const DECIMAL_RE = /^\d+$/;

export const TOOL_ROUTES: Record<DetectedTool, string> = {
  cidr: "/tools/cidr",
  jwt: "/tools/jwt",
  "windows-errors": "/tools/windows-errors",
};

export function detectToolForInput(raw: string): DetectedTool | null {
  const value = raw.trim();
  if (!value) return null;
  if (CIDR_RE.test(value)) return "cidr";
  // A three-segment string only counts as a JWT if it actually decodes —
  // otherwise "www.example.com" (also three dot-separated segments) would
  // misroute a plain domain here instead of leaving it unrecognized.
  if (value.split(".").length === 3 && !isJwtError(decodeJwt(value))) {
    return "jwt";
  }
  if (HEX_RE.test(value)) return "windows-errors";
  if (DECIMAL_RE.test(value)) return "windows-errors";
  return null;
}

// Values that must never appear in a URL (and so in history, Referer
// headers, or server logs) are handed to the target page through
// sessionStorage instead of ?q=. Everything else keeps the shareable ?q=.
const HANDOFF_TOOLS = new Set<DetectedTool>(["jwt"]);
const HANDOFF_KEY = "errno:prefill";

export interface PrefillTarget {
  href: string;
  /** Set when the value must be stashed with stashPrefill before navigating. */
  handoff: { tool: DetectedTool; value: string } | null;
}

export function prefillTarget(tool: DetectedTool, value: string): PrefillTarget {
  if (HANDOFF_TOOLS.has(tool)) {
    return { href: TOOL_ROUTES[tool], handoff: { tool, value } };
  }
  return {
    href: `${TOOL_ROUTES[tool]}?q=${encodeURIComponent(value)}`,
    handoff: null,
  };
}

// Storage can be unavailable (privacy modes, blocked site data); the target
// page then simply opens empty rather than falling back to the URL.
export function stashPrefill(tool: DetectedTool, value: string): void {
  try {
    sessionStorage.setItem(HANDOFF_KEY, JSON.stringify({ tool, value }));
  } catch {}
}

/** Reads the stashed value for `tool` once, and always clears it. */
export function takePrefill(tool: DetectedTool): string | null {
  try {
    const raw = sessionStorage.getItem(HANDOFF_KEY);
    sessionStorage.removeItem(HANDOFF_KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    if (
      typeof parsed === "object" &&
      parsed !== null &&
      (parsed as { tool?: unknown }).tool === tool &&
      typeof (parsed as { value?: unknown }).value === "string"
    ) {
      return (parsed as { value: string }).value;
    }
  } catch {}
  return null;
}
