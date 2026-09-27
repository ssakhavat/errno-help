import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Diagnose this blob — errno.help",
  description:
    "Paste a log line, stack trace, or any mixed text. Finds every IPv4 address, CIDR range, Windows error code, JWT, UUID, Unix timestamp, and hash-like string in it and explains each one — locally in your browser.",
};

export default function DiagnoseLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return children;
}
