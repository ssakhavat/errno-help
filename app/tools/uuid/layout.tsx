import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "UUID / password generator — errno.help",
  description:
    "Generate UUIDs and random passwords locally using the browser's cryptographic randomness APIs.",
};

export default function UuidLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return children;
}
