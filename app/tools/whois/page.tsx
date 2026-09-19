"use client";

import { useState } from "react";
import { ToolHeader } from "@/components/ToolHeader";
import { ClearButton } from "@/components/ClearButton";
import { CopyButton } from "@/components/CopyButton";

interface WhoisResult {
  type: "domain" | "ip";
  handle?: string;
  name?: string;
  status?: string[];
  country?: string;
  startAddress?: string;
  endAddress?: string;
  nameservers?: string[];
  registrar?: string;
  events: { action: string; date: string }[];
}

export default function WhoisPage() {
  const [target, setTarget] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<WhoisResult | null>(null);

  async function runLookup(e?: React.FormEvent) {
    e?.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    try {
      const res = await fetch(`/api/whois?target=${encodeURIComponent(target)}`, {
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

  return (
    <div className="mx-auto min-h-screen w-full max-w-[760px] px-6 py-[clamp(20px,5vh,48px)]">
      <ToolHeader />

      <h1 className="m-0 mb-2 font-serif text-[clamp(22px,3.6vw,32px)] leading-[1.28] font-medium tracking-[-0.01em]">
        WHOIS / RDAP
      </h1>
      <p className="m-0 mb-8 max-w-[58ch] text-sm leading-[1.7] text-text-dim">
        Look up registration data for a domain or IP address via RDAP — the
        server finds the right registry through IANA&apos;s bootstrap list.
      </p>

      <form onSubmit={runLookup} className="mb-8 flex flex-wrap items-center gap-2.5 text-[13.5px]">
        <span className="text-text-faint">target:</span>
        <input
          type="text"
          value={target}
          onChange={(e) => setTarget(e.target.value)}
          placeholder="example.com or 8.8.8.8"
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

      {result && (
        <div>
          <ul className="m-0 list-none border-t border-line p-0">
            <li className="flex justify-between gap-4 border-b border-line py-[7px] text-[13px]">
              <span className="text-text-dim">Type</span>
              <span className="flex items-center gap-3">
                <span className="font-mono text-text">{result.type}</span>
                <CopyButton value={result.type} />
              </span>
            </li>
            {result.name && (
              <li className="flex justify-between gap-4 border-b border-line py-[7px] text-[13px]">
                <span className="text-text-dim">Name</span>
                <span className="flex items-center gap-3">
                  <span className="font-mono text-text">{result.name}</span>
                  <CopyButton value={result.name} />
                </span>
              </li>
            )}
            {result.registrar && (
              <li className="flex justify-between gap-4 border-b border-line py-[7px] text-[13px]">
                <span className="text-text-dim">Registrar</span>
                <span className="flex items-center gap-3">
                  <span className="font-mono text-text">{result.registrar}</span>
                  <CopyButton value={result.registrar} />
                </span>
              </li>
            )}
            {result.country && (
              <li className="flex justify-between gap-4 border-b border-line py-[7px] text-[13px]">
                <span className="text-text-dim">Country</span>
                <span className="flex items-center gap-3">
                  <span className="font-mono text-text">{result.country}</span>
                  <CopyButton value={result.country} />
                </span>
              </li>
            )}
            {result.startAddress && result.endAddress && (
              <li className="flex justify-between gap-4 border-b border-line py-[7px] text-[13px]">
                <span className="text-text-dim">Address range</span>
                <span className="flex items-center gap-3">
                  <span className="font-mono text-text">
                    {result.startAddress} – {result.endAddress}
                  </span>
                  <CopyButton value={`${result.startAddress} - ${result.endAddress}`} />
                </span>
              </li>
            )}
            {result.status && result.status.length > 0 && (
              <li className="flex justify-between gap-4 border-b border-line py-[7px] text-[13px]">
                <span className="text-text-dim">Status</span>
                <span className="flex items-center gap-3">
                  <span className="text-right font-mono text-text">
                    {result.status.join(", ")}
                  </span>
                  <CopyButton value={result.status.join(", ")} />
                </span>
              </li>
            )}
            {result.nameservers && result.nameservers.length > 0 && (
              <li className="flex justify-between gap-4 border-b border-line py-[7px] text-[13px]">
                <span className="text-text-dim">Nameservers</span>
                <span className="flex items-center gap-3">
                  <span className="text-right font-mono text-text">
                    {result.nameservers.join(", ")}
                  </span>
                  <CopyButton value={result.nameservers.join(", ")} />
                </span>
              </li>
            )}
          </ul>

          {result.events.length > 0 && (
            <div className="mt-6">
              <h2 className="m-0 mb-3 text-[13px] text-text-faint">Events</h2>
              <ul className="m-0 list-none border-t border-line p-0">
                {result.events.map((event) => (
                  <li
                    key={`${event.action}-${event.date}`}
                    className="flex justify-between gap-4 border-b border-line py-[7px] text-[13px]"
                  >
                    <span className="text-text-dim">{event.action}</span>
                    <span className="flex items-center gap-3">
                      <span className="font-mono text-text">{event.date}</span>
                      <CopyButton value={event.date} />
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
