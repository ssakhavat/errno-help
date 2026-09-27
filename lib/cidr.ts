export interface CidrResult {
  cidr: string;
  networkAddress: string;
  broadcastAddress: string;
  subnetMask: string;
  wildcardMask: string;
  firstUsable: string;
  lastUsable: string;
  usableHosts: number;
  totalAddresses: number;
}

export interface CidrError {
  error: string;
}

const OCTET = /^\d{1,3}$/;

function ipToInt(ip: string): number | null {
  const parts = ip.split(".");
  if (parts.length !== 4) return null;
  let result = 0;
  for (const part of parts) {
    if (!OCTET.test(part)) return null;
    const n = Number(part);
    if (n < 0 || n > 255) return null;
    result = (result << 8) | n;
  }
  return result >>> 0;
}

function intToIp(int: number): string {
  return [24, 16, 8, 0].map((shift) => (int >>> shift) & 255).join(".");
}

export function calculateCidr(input: string): CidrResult | CidrError {
  const trimmed = input.trim();
  const match = trimmed.match(/^(.+)\/(\d{1,2})$/);
  if (!match) {
    return {
      error: "Expected format: IPv4 address followed by /prefix, e.g. 192.168.1.0/24",
    };
  }

  const [, ipPart, prefixPart] = match;
  const prefix = Number(prefixPart);
  if (!Number.isInteger(prefix) || prefix < 0 || prefix > 32) {
    return { error: "Prefix must be an integer between 0 and 32" };
  }

  const ipInt = ipToInt(ipPart);
  if (ipInt === null) {
    return { error: `"${ipPart}" is not a valid IPv4 address` };
  }

  const maskInt = prefix === 0 ? 0 : (0xffffffff << (32 - prefix)) >>> 0;
  const wildcardInt = ~maskInt >>> 0;
  const networkInt = (ipInt & maskInt) >>> 0;
  const broadcastInt = (networkInt | wildcardInt) >>> 0;
  const totalAddresses = 2 ** (32 - prefix);

  let firstUsable: string;
  let lastUsable: string;
  let usableHosts: number;

  if (prefix >= 31) {
    // /31 (RFC 3021 point-to-point) and /32 (single host) have no
    // network/broadcast reservation, so every address is usable.
    firstUsable = intToIp(networkInt);
    lastUsable = intToIp(broadcastInt);
    usableHosts = prefix === 32 ? 1 : 2;
  } else {
    firstUsable = intToIp(networkInt + 1);
    lastUsable = intToIp(broadcastInt - 1);
    usableHosts = totalAddresses - 2;
  }

  return {
    cidr: `${intToIp(networkInt)}/${prefix}`,
    networkAddress: intToIp(networkInt),
    broadcastAddress: intToIp(broadcastInt),
    subnetMask: intToIp(maskInt),
    wildcardMask: intToIp(wildcardInt),
    firstUsable,
    lastUsable,
    usableHosts,
    totalAddresses,
  };
}

export function isCidrError(
  result: CidrResult | CidrError,
): result is CidrError {
  return "error" in result;
}

export interface Ipv4Class {
  label: string;
  note: string;
}

// Special-purpose ranges from the IANA IPv4 Special-Purpose Address Registry
// (RFC 6890 and successors). Order matters: more specific ranges first.
const SPECIAL_RANGES: [string, number, string, string][] = [
  ["255.255.255.255", 32, "Limited broadcast", "Reaches every host on the local segment; never routed."],
  ["0.0.0.0", 8, "\"This network\"", "Not a real destination; 0.0.0.0 usually means \"any address\" or \"unspecified\"."],
  ["10.0.0.0", 8, "Private (RFC 1918)", "Only reachable inside a private network; not routed on the internet."],
  ["100.64.0.0", 10, "Carrier-grade NAT (RFC 6598)", "Shared address space used between an ISP and its customers' routers."],
  ["127.0.0.0", 8, "Loopback", "Refers to the local machine itself."],
  ["169.254.0.0", 16, "Link-local (APIPA)", "Self-assigned when no DHCP server answered; usually a sign of a DHCP problem."],
  ["172.16.0.0", 12, "Private (RFC 1918)", "Only reachable inside a private network; not routed on the internet."],
  ["192.0.0.0", 24, "IETF protocol assignments", "Reserved for specific protocols; not a normal host address."],
  ["192.0.2.0", 24, "Documentation (TEST-NET-1)", "Reserved for examples in documentation; should not appear in real traffic."],
  ["192.168.0.0", 16, "Private (RFC 1918)", "Only reachable inside a private network; not routed on the internet."],
  ["198.18.0.0", 15, "Benchmarking (RFC 2544)", "Reserved for network device testing."],
  ["198.51.100.0", 24, "Documentation (TEST-NET-2)", "Reserved for examples in documentation; should not appear in real traffic."],
  ["203.0.113.0", 24, "Documentation (TEST-NET-3)", "Reserved for examples in documentation; should not appear in real traffic."],
  ["224.0.0.0", 4, "Multicast", "Delivered to a group of subscribed hosts, not a single machine."],
  ["240.0.0.0", 4, "Reserved", "Reserved for future use; not assignable to hosts."],
];

export function classifyIpv4(ip: string): Ipv4Class | null {
  const ipInt = ipToInt(ip);
  if (ipInt === null) return null;
  for (const [base, prefix, label, note] of SPECIAL_RANGES) {
    const mask = prefix === 0 ? 0 : (0xffffffff << (32 - prefix)) >>> 0;
    if (((ipInt & mask) >>> 0) === ipToInt(base)) return { label, note };
  }
  return { label: "Public", note: "Globally routable internet address." };
}
