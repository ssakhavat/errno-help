"use client";

import { useState } from "react";
import { ALLOWED_PORTS } from "@/lib/ports";
import { ToolHeader } from "@/components/ToolHeader";
import { ClearButton } from "@/components/ClearButton";
import { CopyButton } from "@/components/CopyButton";

interface PortCheckResult {
  host: string;
  resolvedIp: string;
  port: number;
  open: boolean;
}

export default function PortCheckerPage() {
  const [host, setHost] = useState("");
  const [port, setPort] = useState(443);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<PortCheckResult | null>(null);

  async function runCheck(e?: React.FormEvent) {
    e?.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6000);

    try {
      const res = await fetch(
        `/api/port-checker?host=${encodeURIComponent(host)}&port=${port}`,
        { signal: controller.signal },
      );
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
        Port checker
      </h1>
      <p className="m-0 mb-8 max-w-[58ch] text-sm leading-[1.7] text-text-dim">
        Checks whether a common port is open on a public host, with a short
        connection timeout. Limited to well-known ports and public
        addresses, and rate-limited to 10 checks per minute.
      </p>

      <form onSubmit={runCheck} className="mb-8 flex flex-wrap items-center gap-4 text-[13.5px]">
        <label className="flex items-center gap-2.5">
          <span className="text-text-faint">host:</span>
          <input
            type="text"
            value={host}
            onChange={(e) => setHost(e.target.value)}
            placeholder="example.com or 8.8.8.8"
            spellCheck={false}
            className="w-full max-w-[240px] border-0 border-b border-line bg-transparent py-1 font-mono text-[13.5px] text-text placeholder-text-faint focus:border-accent focus:outline-none"
          />
        </label>
        <label className="flex items-center gap-2.5">
          <span className="text-text-faint">port:</span>
          <select
            value={port}
            onChange={(e) => setPort(Number(e.target.value))}
            className="border-0 border-b border-line bg-transparent py-1 font-mono text-[13.5px] text-text focus:border-accent focus:outline-none"
          >
            {ALLOWED_PORTS.map((p) => (
              <option key={p.port} value={p.port}>
                {p.port} — {p.name}
              </option>
            ))}
          </select>
        </label>
        <button
          type="submit"
          disabled={loading}
          className="border-b border-line pb-0.5 font-mono text-[13px] text-text-dim hover:border-accent hover:text-accent disabled:opacity-50"
        >
          {loading ? "Checking…" : "Check →"}
        </button>
        {(host || result || error) && (
          <ClearButton
            onClick={() => {
              setHost("");
              setResult(null);
              setError(null);
            }}
          />
        )}
      </form>

      {error && <p className="text-[13px] text-accent">{error}</p>}

      {result && (
        <ul className="m-0 list-none border-t border-line p-0">
          <li className="flex justify-between gap-4 border-b border-line py-[7px] text-[13px]">
            <span className="text-text-dim">Host</span>
            <span className="flex items-center gap-3">
              <span className="font-mono text-text">
                {result.host} ({result.resolvedIp})
              </span>
              <CopyButton value={`${result.host} (${result.resolvedIp})`} />
            </span>
          </li>
          <li className="flex justify-between gap-4 border-b border-line py-[7px] text-[13px]">
            <span className="text-text-dim">Port</span>
            <span className="flex items-center gap-3">
              <span className="font-mono text-text">{result.port}</span>
              <CopyButton value={String(result.port)} />
            </span>
          </li>
          <li className="flex justify-between gap-4 border-b border-line py-[7px] text-[13px]">
            <span className="text-text-dim">Result</span>
            <span className="flex items-center gap-3">
              <span className={`font-mono ${result.open ? "text-text" : "text-text-faint"}`}>
                {result.open ? "open" : "closed / filtered"}
              </span>
              <CopyButton value={result.open ? "open" : "closed / filtered"} />
            </span>
          </li>
        </ul>
      )}
    </div>
  );
}
