import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "ASN lookup — errno.help",
  description:
    "Look up the autonomous system announcing an IP, or details of an AS number, via Team Cymru's WHOIS service.",
};

export default function AsnLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return children;
}
