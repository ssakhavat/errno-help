import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Windows errors / event IDs — errno.help",
  description:
    "Look up common Windows error codes and Event Viewer IDs from a local reference list, entirely in your browser.",
};

export default function WindowsErrorsLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return children;
}
