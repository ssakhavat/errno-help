"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { detectToolForInput, TOOL_ROUTES } from "@/lib/detectInput";

const tools = [
  { name: "CIDR / IPv4", desc: "subnet, mask, hosts", href: "/tools/cidr" },
  { name: "JWT decoder", desc: "header, payload, claims", href: "/tools/jwt" },
  { name: "Hash generator", desc: "SHA-256, SHA-1, MD5", href: "/tools/hash" },
  { name: "UUID / password", desc: "cryptographically random", href: "/tools/uuid" },
  { name: "YAML ⇄ JSON", desc: "convert and validate", href: "/tools/yaml" },
  { name: "Cron parser", desc: "human-readable schedule", href: "/tools/cron" },
  { name: "Windows errors", desc: "error & event ID lookup", href: "/tools/windows-errors" },
  { name: "Command builders", desc: "robocopy, kubectl, chmod", href: "/tools/commands" },
  { name: "DNS / WHOIS", desc: "lookup and ownership", href: "/tools/network" },
  { name: "GeoIP / port check", desc: "reachability, location", href: "/tools/network" },
];

export default function Home() {
  const router = useRouter();
  const [value, setValue] = useState("");
  const [unrecognized, setUnrecognized] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const tool = detectToolForInput(value);
    if (tool) {
      setUnrecognized(false);
      router.push(TOOL_ROUTES[tool]);
    } else {
      setUnrecognized(true);
    }
  }

  return (
    <div className="home-shell mx-auto flex h-screen w-full max-w-[760px] flex-col overflow-hidden px-6 py-[clamp(20px,5vh,48px)]">
      <div className="flex shrink-0 items-baseline justify-between pb-[clamp(24px,6vh,56px)]">
        <div className="text-base tracking-[-0.01em]">
          errno<span className="text-text-faint">.help</span>
        </div>
        <Link
          href="/tools"
          className="border-b border-line pb-0.5 text-[13px] text-text-dim no-underline hover:border-accent hover:text-accent"
        >
          Open the tools
        </Link>
      </div>

      <main className="flex min-h-0 flex-1 flex-col justify-center">
        <h1 className="m-0 mb-5 max-w-[20ch] font-serif text-[clamp(26px,4.4vw,40px)] leading-[1.28] font-medium tracking-[-0.01em]">
          You have a code. We tell you what it means.
        </h1>
        <p className="m-0 mb-[30px] max-w-[58ch] text-sm leading-[1.7] text-text-dim">
          A plain reference and calculator for the things IT and developer
          work throws at you — error codes, subnets, tokens, hashes, cron
          strings. Runs in your browser; most of it never touches a server.
        </p>

        <form onSubmit={handleSubmit} className="mb-1 flex items-center gap-2.5 text-[13.5px]">
          <span className="text-text-faint">try:</span>
          <input
            type="text"
            value={value}
            onChange={(e) => {
              setValue(e.target.value);
              setUnrecognized(false);
            }}
            placeholder="0x8007000E, 192.168.1.0/24, or a JWT"
            spellCheck={false}
            className="w-full max-w-[340px] border-0 border-b border-line bg-transparent py-1 font-mono text-[13.5px] text-text placeholder-text-faint focus:border-accent focus:outline-none"
          />
        </form>
        {unrecognized && (
          <p className="m-0 mt-2 text-[12px] text-accent">
            Couldn&apos;t tell what kind of code that is — try one of the tools below.
          </p>
        )}
      </main>

      <div className="mt-[clamp(14px,3vh,22px)] shrink-0 border-t border-line pt-[clamp(14px,3vh,22px)]">
        <ul className="m-0 list-none columns-1 gap-x-10 p-0 min-[621px]:columns-2">
          {tools.map((tool) => (
            <li
              key={tool.name}
              className="flex justify-between gap-4 border-b border-line py-[7px] text-[13px] break-inside-avoid-column"
            >
              {tool.href ? (
                <Link
                  href={tool.href}
                  className="text-text no-underline hover:text-accent"
                >
                  {tool.name}
                </Link>
              ) : (
                <span className="text-text">{tool.name}</span>
              )}
              <span className="whitespace-nowrap text-right text-text-faint">
                {tool.desc}
              </span>
            </li>
          ))}
        </ul>
      </div>

      <footer className="shrink-0 pt-[clamp(14px,3vh,20px)] text-[11.5px] text-text-faint">
        No account needed to look something up.
      </footer>
    </div>
  );
}
