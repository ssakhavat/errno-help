import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Robocopy builder — errno.help",
  description:
    "Build a Robocopy command from source, destination, and options, entirely in your browser.",
};

export default function RobocopyLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return children;
}
