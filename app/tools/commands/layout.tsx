import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Command builders — errno.help",
  description:
    "Robocopy, chmod, and kubectl command builders, entirely in your browser.",
};

export default function CommandsLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return children;
}
