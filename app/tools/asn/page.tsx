"use client";

import { useState } from "react";
import { ToolHeader } from "@/components/ToolHeader";
import { ClearButton } from "@/components/ClearButton";
import { CopyButton } from "@/components/CopyButton";

interface AsnResult {
  asn: string;
  ip?: string;
  bgpPrefix?: string;
  countryCode?: string;
  registry?: string;
  allocated?: string;
  asName: string;
}

export default function AsnPage() {
  const [target, setTarget] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AsnResult | null>(null);

  async function runLookup(e?: React.FormEvent) {
    e?.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    try {
      const res = await fetch(`/api/asn?target=${encodeURIComponent(target)}`, {
        signal: controller.signal,
      });
      const json = await res.json();
      if (json.error) {
        setError(json.error);
      } else {
        setResult(json);
      }
    } catch {
      setError("Request failed. Check your connection and try again.");
    } finally {
      clearTimeout(timeout);
      setLoading(false);
    }
  }

  const rows: [string, string][] = result
    ? [
        ["ASN", `AS${result.asn}`],
        ["AS name", result.asName],
        ...(result.ip ? ([["IP", result.ip]] as [string, string][]) : []),
        ...(result.bgpPrefix
          ? ([["BGP prefix", result.bgpPrefix]] as [string, string][])
          : []),
        ...(result.countryCode
          ? ([["Country", result.countryCode]] as [string, string][])
          : []),
        ...(result.registry
          ? ([["Registry", result.registry]] as [string, string][])
          : []),
        ...(result.allocated
          ? ([["Allocated", result.allocated]] as [string, string][])
          : []),
      ]
    : [];

  return (
    <div className="mx-auto min-h-screen w-full max-w-[760px] px-6 py-[clamp(20px,5vh,48px)]">
      <ToolHeader />

      <h1 className="m-0 mb-2 font-serif text-[clamp(22px,3.6vw,32px)] leading-[1.28] font-medium tracking-[-0.01em]">
        ASN lookup
      </h1>
      <p className="m-0 mb-8 max-w-[58ch] text-sm leading-[1.7] text-text-dim">
        Look up the autonomous system announcing an IP address, or the
        details of an AS number, via Team Cymru&apos;s WHOIS service.
      </p>

      <form onSubmit={runLookup} className="mb-8 flex flex-wrap items-center gap-2.5 text-[13.5px]">
        <span className="text-text-faint">target:</span>
        <input
          type="text"
          value={target}
          onChange={(e) => setTarget(e.target.value)}
          placeholder="8.8.8.8 or AS15169"
          spellCheck={false}
          className="w-full max-w-[300px] border-0 border-b border-line bg-transparent py-1 font-mono text-[13.5px] text-text placeholder-text-faint focus:border-accent focus:outline-none"
        />
        <button
          type="submit"
          disabled={loading}
          className="border-b border-line pb-0.5 font-mono text-[13px] text-text-dim hover:border-accent hover:text-accent disabled:opacity-50"
        >
          {loading ? "Looking up…" : "Look up →"}
        </button>
        {(target || result || error) && (
          <ClearButton
            onClick={() => {
              setTarget("");
              setResult(null);
              setError(null);
            }}
          />
        )}
      </form>

      {error && <p className="text-[13px] text-accent">{error}</p>}

      {rows.length > 0 && (
        <ul className="m-0 list-none border-t border-line p-0">
          {rows.map(([label, value]) => (
            <li
              key={label}
              className="flex justify-between gap-4 border-b border-line py-[7px] text-[13px]"
            >
              <span className="text-text-dim">{label}</span>
              <span className="flex items-center gap-3">
                <span className="font-mono text-text">{value}</span>
                <CopyButton value={value} />
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
