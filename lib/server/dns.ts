import { promises as dns } from "node:dns";
import type { MxRecord } from "node:dns";
import { type DnsRecordType } from "@/lib/dnsTypes";

export interface DnsLookupError {
  error: string;
}

const HOSTNAME_RE =
  /^(?=.{1,253}$)(?:(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)\.)+[a-zA-Z]{2,63}$/;

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(
      () => reject(Object.assign(new Error("timeout"), { code: "TIMEOUT" })),
      ms,
    );
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (err) => {
        clearTimeout(timer);
        reject(err);
      },
    );
  });
}

export async function lookupDns(
  domain: string,
  type: DnsRecordType,
): Promise<string[] | DnsLookupError> {
  const trimmed = domain.trim().toLowerCase();
  if (!trimmed) {
    return { error: "Enter a domain name." };
  }
  if (!HOSTNAME_RE.test(trimmed)) {
    return { error: `"${domain}" is not a valid domain name.` };
  }

  try {
    const result = await withTimeout(dns.resolve(trimmed, type), 5000);
    if (type === "MX") {
      return (result as MxRecord[]).map((r) => `${r.priority} ${r.exchange}`);
    }
    if (type === "TXT") {
      return (result as string[][]).map((chunks) => chunks.join(""));
    }
    return result as string[];
  } catch (err) {
    const code = (err as NodeJS.ErrnoException).code;
    if (code === "TIMEOUT") {
      return { error: "DNS lookup timed out." };
    }
    if (code === "ENOTFOUND" || code === "ENODATA") {
      return { error: `No ${type} records found for ${trimmed}.` };
    }
    if (code === "SERVFAIL") {
      return { error: "The DNS server failed to answer (SERVFAIL)." };
    }
    return { error: `DNS lookup failed: ${code ?? (err as Error).message}` };
  }
}
