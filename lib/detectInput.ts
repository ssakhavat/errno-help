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
