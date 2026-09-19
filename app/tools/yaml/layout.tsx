import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "YAML ⇄ JSON — errno.help",
  description:
    "Convert between YAML and JSON locally in your browser, using the yaml package.",
};

export default function YamlLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return children;
}
