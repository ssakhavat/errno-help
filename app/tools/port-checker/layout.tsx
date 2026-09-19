import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Port checker — errno.help",
  description:
    "Check whether a common port is open on a public host, with a strict rate limit and a curated port allowlist.",
};

export default function PortCheckerLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return children;
}
