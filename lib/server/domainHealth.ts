import { lookupDns, type DnsLookupError } from "@/lib/server/dns";
import { lookupWhois, type WhoisResult, type WhoisError } from "@/lib/server/whois";
import { lookupAsn, type AsnResult, type AsnError } from "@/lib/server/asn";
import { lookupGeoIp, type GeoIpResult, type GeoIpError } from "@/lib/server/geoip";
import { checkPort, type PortCheckResult, type PortCheckError } from "@/lib/server/portChecker";
import { DNS_RECORD_TYPES, type DnsRecordType } from "@/lib/dnsTypes";

export interface DomainHealthError {
  error: string;
}

export interface DnsSection {
  type: DnsRecordType;
  records: string[] | null;
  error?: string;
}

export interface DomainHealthReport {
  domain: string;
  resolvedIp: string | null;
  dns: DnsSection[];
  whois: WhoisResult | WhoisError;
  asn: AsnResult | AsnError;
  geoip: GeoIpResult | GeoIpError;
  ports: PortCheckResult[] | PortCheckError;
}

// A short, health-relevant subset of lib/ports.ts's ALLOWED_PORTS — web,
// mail, and remote-access — rather than the full list, since every port
// added here is another socket connection this single report fires off.
const HEALTH_CHECK_PORTS = [80, 443, 21, 22, 25];

function isDnsError(
  result: string[] | DnsLookupError,
): result is DnsLookupError {
  return !Array.isArray(result);
}

export async function getDomainHealth(
  domainInput: string,
): Promise<DomainHealthReport | DomainHealthError> {
  const domain = domainInput.trim().toLowerCase();
  if (!domain) {
    return { error: "Enter a domain name." };
  }

  // Phase 1: DNS records and WHOIS don't depend on each other, so they run
  // together. ASN/GeoIP below need the IP this phase resolves, and the port
  // checks resolve their own host — both wait for this phase to finish.
  const [dns, whois] = await Promise.all([
    Promise.all(
      DNS_RECORD_TYPES.map(async (type): Promise<DnsSection> => {
        const result = await lookupDns(domain, type);
        return isDnsError(result)
          ? { type, records: null, error: result.error }
          : { type, records: result };
      }),
    ),
    lookupWhois(domain),
  ]);

  const resolvedIp =
    dns.find((r) => r.type === "A")?.records?.[0] ??
    dns.find((r) => r.type === "AAAA")?.records?.[0] ??
    null;

  const noIpError: DomainHealthError = {
    error: "No IP address resolved for this domain.",
  };

  // Phase 2: everything that can now run in parallel — ASN and GeoIP need
  // the resolved IP from phase 1, and the port checks against the domain.
  const [asn, geoip, ports] = await Promise.all([
    resolvedIp ? lookupAsn(resolvedIp) : Promise.resolve<AsnError>(noIpError),
    resolvedIp ? lookupGeoIp(resolvedIp) : Promise.resolve<GeoIpError>(noIpError),
    Promise.all(HEALTH_CHECK_PORTS.map((port) => checkPort(domain, port))),
  ]);

  const portsResult: PortCheckResult[] | PortCheckError = ports.every(
    (p): p is PortCheckResult => !("error" in p),
  )
    ? ports
    : { error: ports.find((p): p is PortCheckError => "error" in p)!.error };

  return { domain, resolvedIp, dns, whois, asn, geoip, ports: portsResult };
}
