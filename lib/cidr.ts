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
