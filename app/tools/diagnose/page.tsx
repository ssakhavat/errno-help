"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { diagnoseBlob, MAX_FINDINGS } from "@/lib/diagnose";
import { stashPrefill } from "@/lib/detectInputType";
import { ToolHeader } from "@/components/ToolHeader";
import { ClearButton } from "@/components/ClearButton";

const DEBOUNCE_MS = 250;

const EXAMPLE = `2026-09-27 14:03:11 [ERROR] ts=1790517791 req=5f0c2a1e-8b7d-4c3e-9a21-0e6f4b2d9c11 client=203.0.113.45 upstream=10.12.0.7:8443
Install failed: HRESULT 0x80070005 (last error 32); subnet 172.16.40.0/22 denied`;

export default function DiagnosePage() {
  const [value, setValue] = useState("");
  const [analyzed, setAnalyzed] = useState("");

  useEffect(() => {
    // Deep-link prefill (?q=...): window isn't available at prerender time,
    // so this can only run after mount, and it only fires once per page load.
    const q = new URLSearchParams(window.location.search).get("q");
    if (q) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setValue(q);
      setAnalyzed(q);
    }
  }, []);

  useEffect(() => {
    const id = setTimeout(() => setAnalyzed(value), DEBOUNCE_MS);
    return () => clearTimeout(id);
  }, [value]);

  const hasInput = analyzed.trim().length > 0;
  const { findings, truncated } = hasInput
    ? diagnoseBlob(analyzed)
    : { findings: [], truncated: false };

  function clear() {
    setValue("");
    setAnalyzed("");
  }

  return (
    <div className="mx-auto min-h-screen w-full max-w-[760px] px-6 py-[clamp(20px,5vh,48px)]">
      <ToolHeader />

      <h1 className="m-0 mb-2 font-serif text-[clamp(22px,3.6vw,32px)] leading-[1.28] font-medium tracking-[-0.01em]">
        Diagnose this blob
      </h1>
      <p className="m-0 mb-4 max-w-[58ch] text-sm leading-[1.7] text-text-dim">
        Paste a log line, stack trace, or any mixed text. Every IPv4 address,
        CIDR range, Windows error code, JWT, UUID, Unix timestamp, and
        hash-like string in it is picked out and explained.
      </p>
      <p className="m-0 mb-8 text-[12px] text-text-faint">
        ✓ Analyzed locally — the text is never sent anywhere.
      </p>

      <textarea
        value={value}
        onChange={(e) => setValue(e.target.value)}
        rows={10}
        spellCheck={false}
        placeholder="Paste a log line, stack trace, or error output"
        className="mb-2 w-full resize-y border-0 border-b border-line bg-transparent py-1 font-mono text-[13px] text-text placeholder-text-faint focus:border-accent focus:outline-none"
      />
      <div className="mb-8 flex gap-4">
        {value ? (
          <ClearButton onClick={clear} />
        ) : (
          <button
            type="button"
            onClick={() => setValue(EXAMPLE)}
            className="border-b border-line pb-0.5 text-[12px] text-text-faint hover:border-accent hover:text-accent"
          >
            Load an example
          </button>
        )}
      </div>

      {hasInput && findings.length === 0 && (
        <p className="m-0 max-w-[58ch] text-[13px] leading-[1.7] text-accent">
          Nothing recognized. This tool looks for IPv4 addresses and CIDR
          ranges, Windows error codes (0x… or after &quot;error&quot;/&quot;exit
          code&quot;), JWTs, UUIDs, 10- or 13-digit Unix timestamps, and 32/40/64
          character hex strings.
        </p>
      )}

      {findings.length > 0 && (
        <section>
          <h2 className="m-0 mb-3 text-[13px] text-text-faint">
            {findings.length} recognized
            {truncated && ` — showing the first ${MAX_FINDINGS}`}
          </h2>
          <ul className="m-0 list-none border-t border-line p-0">
            {findings.map((f) => (
              <li key={`${f.kind}:${f.index}`} className="border-b border-line py-4">
                <div className="mb-1 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                  <span className="text-[12px] text-text-faint">
                    {f.label}
                    {f.count > 1 && ` · ${f.count}×`}
                  </span>
                  {f.link && (
                    // No prefetch: the href carries the pasted value, and
                    // prefetching would request it for every row on render.
                    <Link
                      href={f.link.href}
                      prefetch={false}
                      onClick={() => {
                        const h = f.link?.handoff;
                        if (h) stashPrefill(h.tool, h.value);
                      }}
                      className="border-b border-line pb-0.5 text-[12px] text-text-dim no-underline hover:border-accent hover:text-accent"
                    >
                      {f.link.label} →
                    </Link>
                  )}
                </div>
                <div className="mb-1 font-mono text-[13px] break-all text-text">
                  {f.value}
                </div>
                <p className="m-0 text-[13px] leading-[1.6] text-text">
                  {f.summary}
                </p>
                {f.details.length > 0 && (
                  <ul className="m-0 mt-1 list-none p-0 font-mono text-[12px] leading-[1.7] break-all text-text-dim">
                    {f.details.map((d, i) => (
                      <li key={i}>{d}</li>
                    ))}
                  </ul>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
