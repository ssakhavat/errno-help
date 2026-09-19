export const DNS_RECORD_TYPES = ["A", "AAAA", "MX", "TXT", "NS", "CNAME"] as const;
export type DnsRecordType = (typeof DNS_RECORD_TYPES)[number];

export function isDnsRecordType(value: string): value is DnsRecordType {
  return (DNS_RECORD_TYPES as readonly string[]).includes(value);
}
