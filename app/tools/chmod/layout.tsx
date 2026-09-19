import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "chmod builder — errno.help",
  description:
    "Pick owner/group/other permissions and generate both octal and symbolic chmod commands, entirely in your browser.",
};

export default function ChmodLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return children;
}
