import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "GeoIP lookup — errno.help",
  description:
    "Approximate country, city, and coordinates for an IP address, via ipinfo.io.",
};

export default function GeoIpLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return children;
}
