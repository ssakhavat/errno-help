import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Cron parser — errno.help",
  description:
    "Turn a cron expression into a plain-English schedule description, entirely in your browser.",
};

export default function CronLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return children;
}
