import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "WHOIS / RDAP — errno.help",
  description:
    "Look up domain and IP registration data over RDAP, using IANA's bootstrap registry to find the right server.",
};

export default function WhoisLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return children;
}
