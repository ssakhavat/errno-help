"use client";

import { useState } from "react";
import { DNS_RECORD_TYPES, type DnsRecordType } from "@/lib/dnsTypes";
import { ToolHeader } from "@/components/ToolHeader";
import { ClearButton } from "@/components/ClearButton";
import { CopyButton } from "@/components/CopyButton";

export default function DnsPage() {
  const [domain, setDomain] = useState("");
  const [type, setType] = useState<DnsRecordType>("A");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [records, setRecords] = useState<string[] | null>(null);

  async function runLookup(e?: React.FormEvent) {
    e?.preventDefault();
    setLoading(true);
    setError(null);
    setRecords(null);

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    try {
      const res = await fetch(
        `/api/dns?domain=${encodeURIComponent(domain)}&type=${type}`,
        { signal: controller.signal },
      );
      const json = await res.json();
      if (json.error) {
        setError(json.error);
      } else {
        setRecords(json.records);
      }
    } catch {
      setError("Request failed. Check your connection and try again.");
    } finally {
      clearTimeout(timeout);
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto min-h-screen w-full max-w-[760px] px-6 py-[clamp(20px,5vh,48px)]">
      <ToolHeader />

      <h1 className="m-0 mb-2 font-serif text-[clamp(22px,3.6vw,32px)] leading-[1.28] font-medium tracking-[-0.01em]">
        DNS lookup
      </h1>
      <p className="m-0 mb-8 max-w-[58ch] text-sm leading-[1.7] text-text-dim">
        Query DNS records for a domain. Runs through a small server route
        (Node&apos;s built-in resolver) — no third-party API involved.
      </p>

      <form onSubmit={runLookup} className="mb-6 flex items-center gap-2.5 text-[13.5px]">
        <span className="text-text-faint">domain:</span>
        <input
          type="text"
          value={domain}
          onChange={(e) => setDomain(e.target.value)}
          placeholder="example.com"
          spellCheck={false}
          className="w-full max-w-[300px] border-0 border-b border-line bg-transparent py-1 font-mono text-[13.5px] text-text placeholder-text-faint focus:border-accent focus:outline-none"
        />
        {(domain || records || error) && (
          <ClearButton
            onClick={() => {
              setDomain("");
              setRecords(null);
              setError(null);
            }}
          />
        )}
      </form>

      <div className="mb-8 flex flex-wrap gap-3 text-[12px]">
        {DNS_RECORD_TYPES.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setType(t)}
            className={
              t === type
                ? "border-b border-accent pb-0.5 font-mono text-accent"
                : "border-b border-line pb-0.5 font-mono text-text-dim hover:border-accent hover:text-accent"
            }
          >
            {t}
          </button>
        ))}
        <button
          type="button"
          onClick={() => runLookup()}
          disabled={loading}
          className="border-b border-line pb-0.5 font-mono text-text-dim hover:border-accent hover:text-accent disabled:opacity-50"
        >
          {loading ? "Looking up…" : "Look up →"}
        </button>
      </div>

      {error && <p className="text-[13px] text-accent">{error}</p>}

      {records && (
        <ul className="m-0 list-none border-t border-line p-0">
          {records.map((record, i) => (
            <li
              key={`${record}-${i}`}
              className="flex items-center justify-between gap-3 border-b border-line py-2 font-mono text-[13px] text-text"
            >
              <span>{record}</span>
              <CopyButton value={record} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
