import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "kubectl builder — errno.help",
  description:
    "Build common kubectl commands (get, describe, logs, exec, delete, apply) from structured fields, entirely in your browser.",
};

export default function KubectlLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return children;
}
