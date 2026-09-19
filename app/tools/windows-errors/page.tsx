"use client";

import { useState } from "react";
import { searchEventIds, searchWindowsErrors } from "@/lib/windowsLookup";
import { ToolHeader } from "@/components/ToolHeader";
import { CopyButton } from "@/components/CopyButton";

export default function WindowsErrorsPage() {
  const [query, setQuery] = useState("0x80070005");

  const errorResults = searchWindowsErrors(query);
  const eventResults = searchEventIds(query);
  const hasQuery = query.trim().length > 0;
  const noResults =
    hasQuery && errorResults.length === 0 && eventResults.length === 0;

  return (
    <div className="mx-auto min-h-screen w-full max-w-[760px] px-6 py-[clamp(20px,5vh,48px)]">
      <ToolHeader />

      <h1 className="m-0 mb-2 font-serif text-[clamp(22px,3.6vw,32px)] leading-[1.28] font-medium tracking-[-0.01em]">
        Windows errors / event IDs
      </h1>
      <p className="m-0 mb-8 max-w-[58ch] text-sm leading-[1.7] text-text-dim">
        Look up a Windows error code (decimal or hex) or an Event Viewer ID
        by number, or search by keyword. Backed by a local reference list —
        no lookups leave your browser.
      </p>

      <div className="mb-8 flex items-center gap-2.5 text-[13.5px]">
        <span className="text-text-faint">search:</span>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="0x80070005, 5, access denied, or 4625"
          spellCheck={false}
          className="w-full max-w-[340px] border-0 border-b border-line bg-transparent py-1 font-mono text-[13.5px] text-text placeholder-text-faint focus:border-accent focus:outline-none"
        />
      </div>

      {noResults && (
        <p className="text-[13px] text-accent">
          No matches for &quot;{query.trim()}&quot;.
        </p>
      )}

      {errorResults.length > 0 && (
        <section className="mb-8">
          <h2 className="m-0 mb-3 text-[13px] text-text-faint">
            Error codes
          </h2>
          <ul className="m-0 list-none border-t border-line p-0">
            {errorResults.map((e) => (
              <li key={e.code} className="border-b border-line py-3">
                <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                  <span className="font-mono text-[13px] text-text">
                    {e.code}
                  </span>
                  <span className="text-[13px] text-text-dim">{e.name}</span>
                </div>
                <div className="mt-1 flex items-start justify-between gap-3">
                  <p className="m-0 text-[13px] leading-[1.6] text-text-faint">
                    {e.description}
                  </p>
                  <CopyButton value={e.description} />
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      {eventResults.length > 0 && (
        <section>
          <h2 className="m-0 mb-3 text-[13px] text-text-faint">Event IDs</h2>
          <ul className="m-0 list-none border-t border-line p-0">
            {eventResults.map((e) => (
              <li key={e.id} className="border-b border-line py-3">
                <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                  <span className="font-mono text-[13px] text-text">
                    {e.id} · {e.log}
                  </span>
                  <span className="text-[13px] text-text-dim">{e.name}</span>
                </div>
                <div className="mt-1 flex items-start justify-between gap-3">
                  <p className="m-0 text-[13px] leading-[1.6] text-text-faint">
                    {e.description}
                  </p>
                  <CopyButton value={e.description} />
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
