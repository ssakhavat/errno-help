import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Network lookups — errno.help",
  description: "DNS, WHOIS/RDAP, ASN, port checker, and GeoIP tools.",
};

export default function NetworkLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return children;
}
