import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Hash generator — errno.help",
  description:
    "Generate MD5, SHA-1, SHA-256, SHA-384, and SHA-512 hashes locally in your browser using the Web Crypto API.",
};

export default function HashLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return children;
}
