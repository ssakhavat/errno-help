import type { Metadata } from "next";
import Link from "next/link";
import { ToolHeader } from "@/components/ToolHeader";

export const metadata: Metadata = {
  title: "All tools — errno.help",
  description:
    "Every IT and developer lookup and calculator on errno.help, grouped by category.",
};

interface Tool {
  name: string;
  desc: string;
  href: string;
}

interface Category {
  name: string;
  tools: Tool[];
}

const categories: Category[] = [
  {
    name: "Network & security",
    tools: [
      { name: "CIDR / IPv4 calculator", desc: "network, broadcast, mask, usable hosts", href: "/tools/cidr" },
      { name: "DNS lookup", desc: "A, AAAA, MX, TXT, NS, CNAME", href: "/tools/dns" },
      { name: "WHOIS / RDAP", desc: "domain and IP registration data", href: "/tools/whois" },
      { name: "ASN lookup", desc: "IP to autonomous system, or AS details", href: "/tools/asn" },
      { name: "GeoIP lookup", desc: "approximate country, city, coordinates", href: "/tools/geoip" },
      { name: "Port checker", desc: "common ports, rate-limited", href: "/tools/port-checker" },
    ],
  },
  {
    name: "Encoding & data",
    tools: [
      { name: "JWT decoder", desc: "header, payload, claims — decoded locally", href: "/tools/jwt" },
      { name: "Hash generator", desc: "SHA-256, SHA-1, MD5, and more", href: "/tools/hash" },
      { name: "UUID / password generator", desc: "cryptographically random", href: "/tools/uuid" },
      { name: "YAML ⇄ JSON", desc: "convert and validate", href: "/tools/yaml" },
      { name: "Cron parser", desc: "human-readable schedule", href: "/tools/cron" },
    ],
  },
  {
    name: "Windows & commands",
    tools: [
      { name: "Windows errors", desc: "error code & event ID lookup", href: "/tools/windows-errors" },
      { name: "Command builders", desc: "robocopy, chmod, kubectl", href: "/tools/commands" },
    ],
  },
];

export default function ToolsPage() {
  return (
    <div className="mx-auto min-h-screen w-full max-w-[760px] px-6 py-[clamp(20px,5vh,48px)]">
      <ToolHeader />

      <h1 className="m-0 mb-2 font-serif text-[clamp(22px,3.6vw,32px)] leading-[1.28] font-medium tracking-[-0.01em]">
        All tools
      </h1>
      <p className="m-0 mb-10 max-w-[58ch] text-sm leading-[1.7] text-text-dim">
        Every lookup and calculator on errno.help, grouped by category.
      </p>

      <div className="flex flex-col gap-10">
        {categories.map((category) => (
          <section key={category.name}>
            <h2 className="m-0 mb-3 text-[13px] text-text-faint">
              {category.name}
            </h2>
            <ul className="m-0 list-none border-t border-line p-0">
              {category.tools.map((tool) => (
                <li key={tool.href} className="border-b border-line py-3">
                  <Link
                    href={tool.href}
                    className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 text-text no-underline hover:text-accent"
                  >
                    <span className="text-[13px]">{tool.name}</span>
                    <span className="font-mono text-[13px] text-text-faint">
                      {tool.desc}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}
