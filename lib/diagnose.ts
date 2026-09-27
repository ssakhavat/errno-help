import { calculateCidr, classifyIpv4, isCidrError } from "@/lib/cidr";
import { decodeJwt, isJwtError } from "@/lib/jwt";
import { findWindowsErrorsByCode } from "@/lib/windowsLookup";
import {
  detectToolForInput,
  prefillTarget,
  type PrefillTarget,
} from "@/lib/detectInputType";

export type FindingKind =
  | "jwt"
  | "uuid"
  | "cidr"
  | "ipv4"
  | "windows-error"
  | "hex"
  | "hash"
  | "timestamp";

export interface FindingLink {
  href: string;
  label: string;
  /** Stash with stashPrefill before following the link (JWTs stay out of URLs). */
  handoff?: PrefillTarget["handoff"];
}

export interface Finding {
  kind: FindingKind;
  label: string;
  value: string;
  /** Offset of the first occurrence in the input. */
  index: number;
  /** How many times this exact value appears. */
  count: number;
  summary: string;
  details: string[];
  link: FindingLink | null;
}

export interface Diagnosis {
  findings: Finding[];
  /** True when more distinct values were found than MAX_FINDINGS. */
  truncated: boolean;
}

export const MAX_FINDINGS = 200;

// Earliest/latest instant accepted as a Unix timestamp. The lower bound is
// where 10-digit second counts begin (2001-09-09), so any 10- or 13-digit
// number is checked against the same window.
const TIMESTAMP_MIN_MS = 1_000_000_000_000;
const TIMESTAMP_MAX_MS = Date.UTC(2100, 0, 1);

type Built = Omit<Finding, "index" | "count">;

// Reuses the global search's routing: a link only prefills a tool page when
// that page would recognize the value on its own.
function prefillLink(query: string, label: string): FindingLink | null {
  const tool = detectToolForInput(query);
  if (!tool) return null;
  const { href, handoff } = prefillTarget(tool, query);
  return { href, label, handoff };
}

function hex32(n: number): string {
  return "0x" + n.toString(16).toUpperCase().padStart(8, "0");
}

function truncate(s: string, max: number): string {
  return s.length > max ? s.slice(0, max - 1) + "…" : s;
}

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

// ---------------------------------------------------------------- JWT

const JWT_RE =
  /(?<![\w.-])[A-Za-z0-9_-]{4,}\.[A-Za-z0-9_-]{4,}\.[A-Za-z0-9_-]*(?![\w-]|\.[\w-])/g;

const TIME_CLAIMS = new Set(["exp", "iat", "nbf", "auth_time"]);

function buildJwt(token: string): Built | null {
  const decoded = decodeJwt(token);
  if (isJwtError(decoded)) return null;
  // decodeJwt accepts any JSON; a real JWT has object header and payload.
  // Without this, "MTIz.MTIz.x" ("123"."123") would count as a token.
  if (!isPlainObject(decoded.header) || !isPlainObject(decoded.payload)) {
    return null;
  }

  const header = decoded.header;
  const payload = decoded.payload;
  const headerBits = ["alg", "typ", "kid"]
    .filter((k) => header[k] !== undefined)
    .map((k) => `${k}: ${truncate(String(header[k]), 40)}`);

  const details: string[] = [];
  const keys = Object.keys(payload);
  for (const key of keys.slice(0, 8)) {
    const v = payload[key];
    if (TIME_CLAIMS.has(key) && typeof v === "number") {
      const date = new Date(v * 1000);
      let line = `${key}: ${v} → ${date.toISOString()}`;
      if (key === "exp") {
        line += date.getTime() < Date.now() ? " (expired)" : " (not yet expired)";
      }
      details.push(line);
    } else {
      const shown = typeof v === "string" ? v : JSON.stringify(v);
      details.push(`${key}: ${truncate(shown ?? String(v), 60)}`);
    }
  }
  if (keys.length > 8) details.push(`… ${keys.length - 8} more claims`);
  details.push(
    decoded.signaturePresent
      ? "Signature present — not verified."
      : "Signature segment empty — unsigned token.",
  );

  return {
    kind: "jwt",
    label: "JWT",
    value: token,
    summary: `Decoded locally. Header ${headerBits.join(" · ") || "has no alg/typ"}.`,
    details,
    link: prefillLink(token, "Open in JWT decoder"),
  };
}

// ---------------------------------------------------------------- UUID

const UUID_RE =
  /(?<![\w-])[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}(?![\w-])/gi;

const UUID_VERSIONS: Record<string, string> = {
  "1": "version 1 (time and node based)",
  "2": "version 2 (DCE security)",
  "3": "version 3 (name based, MD5)",
  "4": "version 4 (random)",
  "5": "version 5 (name based, SHA-1)",
  "6": "version 6 (reordered time based)",
  "7": "version 7 (Unix time ordered)",
  "8": "version 8 (custom)",
};

function buildUuid(uuid: string): Built {
  const lower = uuid.toLowerCase();
  const base = {
    kind: "uuid" as const,
    label: "UUID",
    value: uuid,
    link: { href: "/tools/uuid", label: "UUID generator" },
  };

  if (lower === "00000000-0000-0000-0000-000000000000") {
    return { ...base, summary: "Nil UUID — all bits zero, usually a placeholder or unset value.", details: [] };
  }
  if (lower === "ffffffff-ffff-ffff-ffff-ffffffffffff") {
    return { ...base, summary: "Max UUID — all bits one (RFC 9562).", details: [] };
  }

  const versionChar = lower[14];
  const variantChar = lower[19];
  const rfcVariant = "89ab".includes(variantChar);
  const version = UUID_VERSIONS[versionChar];

  if (!rfcVariant || !version) {
    return {
      ...base,
      summary: "Has the 8-4-4-4-12 UUID layout, but its version/variant bits are not RFC 9562 values.",
      details: [
        `Version nibble: ${versionChar}`,
        `Variant nibble: ${variantChar}${rfcVariant ? "" : " (not the RFC variant 8–b; possibly a legacy Microsoft GUID)"}`,
      ],
    };
  }

  const details: string[] = [];
  if (versionChar === "7") {
    const ms = parseInt(lower.slice(0, 8) + lower.slice(9, 13), 16);
    details.push(`Embedded time: ${new Date(ms).toISOString()}`);
  }

  return {
    ...base,
    summary: `Valid UUID format, ${version}.`,
    details,
  };
}

// ---------------------------------------------------------------- IPv4 / CIDR

// Rejects matches glued to other digits or dots, so version strings like
// "1.2.3.4.5" and the middle of longer dotted runs are not picked up.
const IPV4_RE =
  /(?<![\w.])(\d{1,3}(?:\.\d{1,3}){3})(?:\/(\d{1,2}))?(?![\w]|\.\d)/g;

function validOctets(ip: string): boolean {
  return ip.split(".").every((o) => Number(o) <= 255);
}

function buildIpv4(ip: string): Built | null {
  const cls = classifyIpv4(ip);
  if (!cls) return null;
  return {
    kind: "ipv4",
    label: "IPv4 address",
    value: ip,
    summary: `${cls.label}. ${cls.note}`,
    details: [],
    link: prefillLink(`${ip}/32`, "Open in CIDR calculator"),
  };
}

function buildCidr(cidr: string, ip: string): Built | null {
  const result = calculateCidr(cidr);
  if (isCidrError(result)) return null;
  const cls = classifyIpv4(result.networkAddress);
  const details = [
    `Range: ${result.networkAddress} – ${result.broadcastAddress}`,
    `Mask: ${result.subnetMask} (wildcard ${result.wildcardMask})`,
    `Usable hosts: ${result.usableHosts.toLocaleString("en-US")} (${result.firstUsable} – ${result.lastUsable})`,
  ];
  if (ip !== result.networkAddress) {
    details.push(`${ip} is a host inside ${result.cidr}, not the network address.`);
  }
  return {
    kind: "cidr",
    label: "CIDR range",
    value: cidr,
    summary: cls ? `${cls.label}. ${cls.note}` : "IPv4 subnet.",
    details,
    link: prefillLink(cidr, "Open in CIDR calculator"),
  };
}

// ---------------------------------------------------------------- Windows codes

const HEX_RE = /(?<![\w])0x[0-9a-f]{1,8}(?![\w])/gi;

// A bare number only counts as a Windows error code when a keyword right
// before it says so — otherwise every line number, port, and PID in a log
// would "match" some low Win32 code.
const DECIMAL_CODE_RE =
  /\b(?:error(?:[ _]?code)?|err|errno|exit[ _]?(?:code|status)|last[ _]?error|hresult|rc)\s*[:=#]?\s*\(?(-?\d{1,10})(?![\w.])/gi;

interface WindowsMatch {
  name: string;
  description: string;
  /** Present when the code was only found by unwrapping an HRESULT. */
  win32Code?: number;
}

function lookupWindowsCode(code: string): WindowsMatch | null {
  const direct = findWindowsErrorsByCode(code);
  if (direct.length > 0) return direct[0];

  // HRESULT_FROM_WIN32: 0x8007xxxx carries a plain Win32 code in the low 16
  // bits, so 0x80070020 is ERROR_SHARING_VIOLATION (32) even if the table
  // only lists the decimal form.
  const n = code.startsWith("-")
    ? Number(code) >>> 0
    : code.toLowerCase().startsWith("0x")
      ? parseInt(code.slice(2), 16)
      : Number(code);
  if (n >>> 16 === 0x8007) {
    const win32 = n & 0xffff;
    const wrapped = findWindowsErrorsByCode(String(win32));
    if (wrapped.length > 0) return { ...wrapped[0], win32Code: win32 };
  }
  return null;
}

function buildWindowsError(
  code: string,
  numeric: number,
  match: WindowsMatch,
): Built {
  const details = [match.description];
  const isHex = code.toLowerCase().startsWith("0x");
  if (isHex) {
    details.push(`Decimal: ${numeric}`);
  } else if (numeric > 0xffff) {
    details.push(`Hex: ${hex32(numeric)}`);
  }
  if (match.win32Code !== undefined) {
    details.push(`HRESULT wrapping Win32 error ${match.win32Code}.`);
  }
  const linkQuery =
    match.win32Code !== undefined ? String(match.win32Code) : code;
  return {
    kind: "windows-error",
    label: "Windows error code",
    value: code,
    summary: match.name,
    details,
    link: prefillLink(linkQuery, "Open in Windows errors"),
  };
}

function buildHex(code: string): Built {
  const n = parseInt(code.slice(2), 16);
  const match = lookupWindowsCode(code);
  if (match) return buildWindowsError(code, n, match);

  const details = [`Decimal: ${n}`];
  if (code.length === 10 && n >= 0x80000000) {
    details.push(
      `If this is an HRESULT: failure, facility ${(n >>> 16) & 0x7ff}, code ${n & 0xffff}.`,
    );
  }
  return {
    kind: "hex",
    label: "Hex value",
    value: code,
    summary: "Not a Windows error code in our table.",
    details,
    link: null,
  };
}

// ---------------------------------------------------------------- Hashes

const HASH_RE =
  /(?<![\w])(?:[0-9a-f]{64}|[0-9a-f]{40}|[0-9a-f]{32})(?![\w])/gi;

const HASH_INFO: Record<number, [string, string]> = {
  32: ["MD5", "Same length as an NTLM hash or a UUID without dashes."],
  40: ["SHA-1", "Also the length of a Git commit ID."],
  64: ["SHA-256", "Also the length of SHA3-256 and BLAKE2s-256 digests."],
};

function buildHash(value: string): Built | null {
  // A run of pure digits or pure letters is far more likely to be something
  // else (an ID, a long number) than a digest.
  if (!/[a-f]/i.test(value) || !/\d/.test(value)) return null;
  const [algo, alsoNote] = HASH_INFO[value.length];
  return {
    kind: "hash",
    label: "Hash-like hex string",
    value,
    summary: `Looks like the ${algo} format (${value.length} hex characters).`,
    details: [
      alsoNote,
      "A hash can't be decoded; to check a value, hash it and compare.",
    ],
    link: { href: "/tools/hash", label: "Hash generator" },
  };
}

// ---------------------------------------------------------------- Timestamps

const TIMESTAMP_RE = /(?<![\w.])(\d{13}|\d{10}(?:\.\d{1,6})?)(?![\w]|\.\d)/g;

function relative(ms: number, now: number): string {
  const diff = ms - now;
  const abs = Math.abs(diff);
  const units: [number, string][] = [
    [365 * 24 * 3600e3, "year"],
    [30 * 24 * 3600e3, "month"],
    [24 * 3600e3, "day"],
    [3600e3, "hour"],
    [60e3, "minute"],
  ];
  for (const [size, name] of units) {
    if (abs >= size) {
      const n = Math.floor(abs / size);
      const text = `${n} ${name}${n === 1 ? "" : "s"}`;
      return diff < 0 ? `${text} ago` : `in ${text}`;
    }
  }
  return "within the last minute";
}

function buildTimestamp(value: string, now: number): Built | null {
  const isMs = value.length === 13;
  const ms = isMs ? Number(value) : Number(value) * 1000;
  if (ms < TIMESTAMP_MIN_MS || ms >= TIMESTAMP_MAX_MS) return null;
  const date = new Date(ms);
  return {
    kind: "timestamp",
    label: `Unix timestamp (${isMs ? "milliseconds" : "seconds"})`,
    value,
    summary: `${date.toISOString().replace(".000Z", "Z")} (UTC)`,
    details: [`Local: ${date.toLocaleString()}`, relative(ms, now)],
    link: null,
  };
}

// ---------------------------------------------------------------- Driver

export function diagnoseBlob(text: string, now: number = Date.now()): Diagnosis {
  const candidates: { start: number; built: Built }[] = [];
  // Detectors run in priority order and each claims its span, so a hex run
  // inside a JWT or the digits of an IP address aren't reported twice.
  const claimed = new Uint8Array(text.length);

  function tryAdd(start: number, end: number, build: () => Built | null) {
    for (let i = start; i < end; i++) if (claimed[i]) return;
    const built = build();
    if (!built) return;
    claimed.fill(1, start, end);
    candidates.push({ start, built });
  }

  for (const m of text.matchAll(JWT_RE)) {
    tryAdd(m.index, m.index + m[0].length, () => buildJwt(m[0]));
  }

  for (const m of text.matchAll(UUID_RE)) {
    tryAdd(m.index, m.index + m[0].length, () => buildUuid(m[0]));
  }

  for (const m of text.matchAll(IPV4_RE)) {
    const [whole, ip, prefix] = m;
    if (!validOctets(ip)) continue;
    if (prefix !== undefined && Number(prefix) <= 32) {
      tryAdd(m.index, m.index + whole.length, () => buildCidr(whole, ip));
    } else {
      tryAdd(m.index, m.index + ip.length, () => buildIpv4(ip));
    }
  }

  for (const m of text.matchAll(HEX_RE)) {
    tryAdd(m.index, m.index + m[0].length, () => buildHex(m[0]));
  }

  for (const m of text.matchAll(DECIMAL_CODE_RE)) {
    const code = m[1];
    // The code is the last thing the pattern consumes.
    const end = m.index + m[0].length;
    const start = end - code.length;
    tryAdd(start, end, () => {
      const match = lookupWindowsCode(code);
      if (!match) return null;
      return buildWindowsError(code, Number(code) >>> 0, match);
    });
  }

  for (const m of text.matchAll(HASH_RE)) {
    tryAdd(m.index, m.index + m[0].length, () => buildHash(m[0]));
  }

  for (const m of text.matchAll(TIMESTAMP_RE)) {
    tryAdd(m.index, m.index + m[0].length, () => buildTimestamp(m[0], now));
  }

  candidates.sort((a, b) => a.start - b.start);

  const byKey = new Map<string, Finding>();
  let truncated = false;
  for (const { start, built } of candidates) {
    const key = `${built.kind}:${built.value.toLowerCase()}`;
    const existing = byKey.get(key);
    if (existing) {
      existing.count++;
      continue;
    }
    if (byKey.size >= MAX_FINDINGS) {
      truncated = true;
      continue;
    }
    byKey.set(key, { ...built, index: start, count: 1 });
  }

  return { findings: [...byKey.values()], truncated };
}
