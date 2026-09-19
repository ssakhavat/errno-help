import Link from "next/link";
import { ToolHeader } from "@/components/ToolHeader";

const tools = [
  { name: "DNS lookup", desc: "A, AAAA, MX, TXT, NS, CNAME", href: "/tools/dns" },
  { name: "WHOIS / RDAP", desc: "domain and IP registration data", href: "/tools/whois" },
  { name: "ASN lookup", desc: "IP to autonomous system, or AS details", href: "/tools/asn" },
  { name: "Port checker", desc: "common ports, rate-limited", href: "/tools/port-checker" },
  { name: "GeoIP lookup", desc: "approximate country, city, coordinates", href: "/tools/geoip" },
];

export default function NetworkPage() {
  return (
    <div className="mx-auto min-h-screen w-full max-w-[760px] px-6 py-[clamp(20px,5vh,48px)]">
      <ToolHeader />

      <h1 className="m-0 mb-2 font-serif text-[clamp(22px,3.6vw,32px)] leading-[1.28] font-medium tracking-[-0.01em]">
        Network lookups
      </h1>
      <p className="m-0 mb-8 max-w-[58ch] text-sm leading-[1.7] text-text-dim">
        Each of these calls a small server route — the browser never talks
        to the upstream service directly.
      </p>

      <ul className="m-0 list-none border-t border-line p-0">
        {tools.map((t) => (
          <li key={t.href} className="border-b border-line py-3">
            <Link
              href={t.href}
              className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 text-text no-underline hover:text-accent"
            >
              <span className="text-[13px]">{t.name}</span>
              <span className="font-mono text-[13px] text-text-faint">
                {t.desc}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
