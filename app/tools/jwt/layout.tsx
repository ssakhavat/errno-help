import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "JWT decoder — errno.help",
  description:
    "Decode a JSON Web Token's header and payload locally in your browser. Decoding is not the same as signature verification.",
};

export default function JwtLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return children;
}
