import net from "node:net";

export interface AsnError {
  error: string;
}

export interface AsnResult {
  asn: string;
  ip?: string;
  bgpPrefix?: string;
  countryCode?: string;
  registry?: string;
  allocated?: string;
  asName: string;
}

const IPV4_RE = /^(\d{1,3}\.){3}\d{1,3}$/;
const IPV6_RE = /^[0-9a-fA-F:]+$/;
const ASN_RE = /^(?:AS)?(\d+)$/i;

function looksLikeIp(value: string): boolean {
  if (IPV4_RE.test(value)) return true;
  return value.includes(":") && IPV6_RE.test(value);
}

function queryCymru(query: string, timeoutMs = 5000): Promise<string> {
  return new Promise((resolve, reject) => {
    const socket = net.createConnection({ host: "whois.cymru.com", port: 43 });
    let data = "";

    const timer = setTimeout(() => {
      socket.destroy();
      reject(Object.assign(new Error("timeout"), { code: "TIMEOUT" }));
    }, timeoutMs);

    socket.on("connect", () => {
      socket.write(`${query}\r\n`);
    });
    socket.on("data", (chunk) => {
      data += chunk.toString("utf8");
    });
    socket.on("end", () => {
      clearTimeout(timer);
      resolve(data);
    });
    socket.on("error", (err) => {
      clearTimeout(timer);
      reject(err);
    });
  });
}

export async function lookupAsn(target: string): Promise<AsnResult | AsnError> {
  const trimmed = target.trim();
  if (!trimmed) {
    return { error: "Enter an IP address or AS number." };
  }

  const isIp = looksLikeIp(trimmed);
  const asnMatch = trimmed.match(ASN_RE);

  if (!isIp && !asnMatch) {
    return { error: `"${target}" is not a valid IP address or AS number.` };
  }

  const query = isIp ? ` -v ${trimmed}` : ` -v AS${asnMatch![1]}`;

  let raw: string;
  try {
    raw = await queryCymru(query);
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === "TIMEOUT") {
      return { error: "The lookup timed out." };
    }
    return { error: "Could not reach the ASN lookup service." };
  }

  const lines = raw
    .trim()
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
  if (lines.length < 2) {
    return { error: `No ASN data found for "${target}".` };
  }

  const fields = lines[1].split("|").map((f) => f.trim());

  if (isIp) {
    const [asn, ip, bgpPrefix, countryCode, registry, allocated, asName] = fields;
    if (asn === "NA") {
      return { error: `No announced BGP route found for ${trimmed}.` };
    }
    return { asn, ip, bgpPrefix, countryCode, registry, allocated, asName: asName ?? "" };
  }

  const [asn, countryCode, registry, allocated, asName] = fields;
  if (asn === "NA") {
    return { error: `AS${asnMatch![1]} was not found.` };
  }
  return { asn, countryCode, registry, allocated, asName: asName ?? "" };
}
