"use client";

import { useEffect, useState } from "react";
import { digest, HASH_ALGORITHMS } from "@/lib/hash";
import { ToolHeader } from "@/components/ToolHeader";
import { ClearButton } from "@/components/ClearButton";
import { CopyButton } from "@/components/CopyButton";

export default function HashPage() {
  const [text, setText] = useState("");
  const [results, setResults] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      try {
        const entries = await Promise.all(
          HASH_ALGORITHMS.map(
            async (algo) => [algo, await digest(algo, text)] as const,
          ),
        );
        if (!cancelled) {
          setResults(Object.fromEntries(entries));
          setError(null);
        }
      } catch {
        if (!cancelled) setError("Could not hash this input.");
      }
    }

    run();
    return () => {
      cancelled = true;
    };
  }, [text]);

  return (
    <div className="mx-auto min-h-screen w-full max-w-[760px] px-6 py-[clamp(20px,5vh,48px)]">
      <ToolHeader />

      <h1 className="m-0 mb-2 font-serif text-[clamp(22px,3.6vw,32px)] leading-[1.28] font-medium tracking-[-0.01em]">
        Hash generator
      </h1>
      <p className="m-0 mb-8 max-w-[58ch] text-sm leading-[1.7] text-text-dim">
        Hashes are computed locally using the browser&apos;s Web Crypto API
        (MD5 uses a small local implementation, since browsers don&apos;t
        provide it natively). Nothing you type here leaves your browser.
      </p>

      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={3}
        spellCheck={false}
        placeholder="Text to hash"
        className="mb-2 w-full resize-none border-0 border-b border-line bg-transparent py-1 font-mono text-[13.5px] text-text placeholder-text-faint focus:border-accent focus:outline-none"
      />
      <div className="mb-8">
        {text && <ClearButton onClick={() => setText("")} />}
      </div>

      {error && <p className="mb-8 text-[13px] text-accent">{error}</p>}

      <ul className="m-0 list-none border-t border-line p-0">
        {HASH_ALGORITHMS.map((algo) => (
          <li
            key={algo}
            className="flex flex-col gap-1 border-b border-line py-[10px] text-[13px] sm:flex-row sm:items-baseline sm:justify-between"
          >
            <span className="shrink-0 text-text-faint">{algo}</span>
            <span className="flex items-center gap-3">
              <span className="break-all font-mono text-text">
                {results[algo] ?? "—"}
              </span>
              {results[algo] && <CopyButton value={results[algo]} />}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
