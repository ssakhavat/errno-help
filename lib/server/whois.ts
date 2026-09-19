import {
  domain as rdapDomain,
  ip as rdapIp,
  configure,
  RdapValidationError,
  RdapServerNotFoundError,
  RdapRegistryError,
  RdapNetworkError,
  RdapTimeoutError,
  type RdapEntityObjectClass,
} from "node-rdap";

// A registry lookup can legitimately take a couple of seconds; cache
// successful lookups for an hour since domain/IP registration data
// doesn't change from one minute to the next.
configure({ timeoutMs: 8000, cacheTtlSeconds: 3600 });

const IPV4_RE = /^(\d{1,3}\.){3}\d{1,3}$/;
const IPV6_RE = /^[0-9a-fA-F:]+$/;

function looksLikeIp(value: string): boolean {
  if (IPV4_RE.test(value)) return true;
  return value.includes(":") && IPV6_RE.test(value);
}

function extractVCardField(
  entity: RdapEntityObjectClass,
  field: string,
): string | undefined {
  const props = entity.vcardArray?.[1];
  if (!props) return undefined;
  const prop = props.find((p) => p[0] === field);
  const value = prop?.[3];
  return typeof value === "string" ? value : undefined;
}

function findRegistrarName(
  entities?: RdapEntityObjectClass[],
): string | undefined {
  const registrar = entities?.find((e) => e.roles?.includes("registrar"));
  if (!registrar) return undefined;
  return extractVCardField(registrar, "fn") ?? registrar.handle;
}

export interface WhoisError {
  error: string;
}

export interface WhoisResult {
  type: "domain" | "ip";
  handle?: string;
  name?: string;
  status?: string[];
  country?: string;
  startAddress?: string;
  endAddress?: string;
  nameservers?: string[];
  registrar?: string;
  events: { action: string; date: string }[];
}

export async function lookupWhois(
  target: string,
): Promise<WhoisResult | WhoisError> {
  const trimmed = target.trim();
  if (!trimmed) {
    return { error: "Enter a domain name or IP address." };
  }

  try {
    if (looksLikeIp(trimmed)) {
      const result = await rdapIp(trimmed);
      return {
        type: "ip",
        handle: result.handle,
        name: result.name,
        status: result.status,
        country: result.country,
        startAddress: result.startAddress,
        endAddress: result.endAddress,
        registrar: findRegistrarName(result.entities),
        events: (result.events ?? []).map((e) => ({
          action: e.eventAction,
          date: e.eventDate,
        })),
      };
    }

    const result = await rdapDomain(trimmed.toLowerCase());
    return {
      type: "domain",
      handle: result.handle,
      name: result.ldhName,
      status: result.status,
      nameservers: result.nameservers
        ?.map((ns) => ns.ldhName)
        .filter((n): n is string => !!n),
      registrar: findRegistrarName(result.entities),
      events: (result.events ?? []).map((e) => ({
        action: e.eventAction,
        date: e.eventDate,
      })),
    };
  } catch (err) {
    if (err instanceof RdapValidationError) {
      return { error: `"${target}" is not a valid domain name or IP address.` };
    }
    if (err instanceof RdapServerNotFoundError) {
      return { error: "No RDAP server is registered for this domain or address." };
    }
    if (err instanceof RdapRegistryError) {
      return {
        error: `The registry answered with an error (${err.status} ${err.statusText}).`,
      };
    }
    if (err instanceof RdapTimeoutError) {
      return { error: "The registry did not respond in time." };
    }
    if (err instanceof RdapNetworkError) {
      return { error: "Could not reach the registry." };
    }
    return { error: `Lookup failed: ${(err as Error).message}` };
  }
}
