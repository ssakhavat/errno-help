import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "DNS lookup — errno.help",
  description:
    "Query A, AAAA, MX, TXT, NS, and CNAME records for a domain via a small server route.",
};

export default function DnsLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return children;
}
