import net from "node:net";
import { promises as dns } from "node:dns";
import { isIP } from "node:net";
import { ALLOWED_PORTS } from "@/lib/ports";

export interface PortCheckError {
  error: string;
}

export interface PortCheckResult {
  host: string;
  resolvedIp: string;
  port: number;
  open: boolean;
}

const ALLOWED_PORT_SET = new Set(ALLOWED_PORTS.map((p) => p.port));

const HOSTNAME_RE =
  /^(?=.{1,253}$)(?:(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)\.)+[a-zA-Z]{2,63}$/;

// Blocks loopback, private, link-local, CGNAT, and other non-public ranges
// so this can't be used to probe the internal network it runs on (SSRF).
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
      // IPv4-mapped address — check the embedded v4 address too.
      const embedded = lower.split(":").pop() ?? "";
      if (embedded.includes(".")) return isPrivateOrReservedIp(embedded);
    }
    return false;
  }
  return true; // not a parseable IP at all — treat as unsafe
}

async function resolveHost(host: string): Promise<string | PortCheckError> {
  if (isIP(host)) {
    return isPrivateOrReservedIp(host)
      ? { error: "That address is not publicly routable." }
      : host;
  }
  if (!HOSTNAME_RE.test(host)) {
    return { error: `"${host}" is not a valid host name or IP address.` };
  }
  try {
    const { address } = await dns.lookup(host);
    if (isPrivateOrReservedIp(address)) {
      return { error: "That host resolves to a non-public address." };
    }
    return address;
  } catch {
    return { error: `Could not resolve "${host}".` };
  }
}

function isPortCheckError(
  value: string | PortCheckError,
): value is PortCheckError {
  return typeof value !== "string";
}

function tryConnect(ip: string, port: number, timeoutMs: number): Promise<boolean> {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    let settled = false;

    const finish = (open: boolean) => {
      if (settled) return;
      settled = true;
      socket.destroy();
      resolve(open);
    };

    socket.setTimeout(timeoutMs);
    socket.once("connect", () => finish(true));
    socket.once("timeout", () => finish(false));
    socket.once("error", () => finish(false));
    socket.connect(port, ip);
  });
}

export async function checkPort(
  host: string,
  port: number,
): Promise<PortCheckResult | PortCheckError> {
  const trimmedHost = host.trim();
  if (!trimmedHost) {
    return { error: "Enter a host name or IP address." };
  }
  if (!ALLOWED_PORT_SET.has(port)) {
    return {
      error: `Port ${port} isn't in the list of common ports this tool checks.`,
    };
  }

  const resolved = await resolveHost(trimmedHost);
  if (isPortCheckError(resolved)) {
    return resolved;
  }

  const open = await tryConnect(resolved, port, 3000);
  return { host: trimmedHost, resolvedIp: resolved, port, open };
}
