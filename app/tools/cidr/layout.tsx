import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "CIDR / IPv4 calculator — errno.help",
  description:
    "Calculate network address, broadcast address, subnet mask, and usable host range from IPv4 CIDR notation, entirely in your browser.",
};

export default function CidrLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return children;
}
