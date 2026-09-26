"use client";

import { useState } from "react";
import {
  testRegex,
  isRegexError,
  buildHighlightSegments,
} from "@/lib/regex";
import { ToolHeader } from "@/components/ToolHeader";
import { ClearButton } from "@/components/ClearButton";
import { CopyButton } from "@/components/CopyButton";

export default function RegexPage() {
  const [pattern, setPattern] = useState("");
  const [flags, setFlags] = useState("g");
  const [input, setInput] = useState("");

  const result = pattern ? testRegex(pattern, flags, input) : null;
  const error = result && isRegexError(result) ? result.error : null;
  const matches = result && !isRegexError(result) ? result.matches : [];
  const segments = buildHighlightSegments(input, matches);

  return (
    <div className="mx-auto min-h-screen w-full max-w-[760px] px-6 py-[clamp(20px,5vh,48px)]">
      <ToolHeader />

      <h1 className="m-0 mb-2 font-serif text-[clamp(22px,3.6vw,32px)] leading-[1.28] font-medium tracking-[-0.01em]">
        Regex tester
      </h1>
      <p className="m-0 mb-8 max-w-[58ch] text-sm leading-[1.7] text-text-dim">
        Matches update as you type, using the browser&apos;s native{" "}
        <code className="text-text">RegExp</code> engine. Nothing you type
        here leaves your browser.
      </p>

      <div className="mb-2 flex items-center gap-2">
        <span className="shrink-0 text-text-faint">/</span>
        <input
          type="text"
          value={pattern}
          onChange={(e) => setPattern(e.target.value)}
          spellCheck={false}
          placeholder="pattern"
          className="min-w-0 flex-1 border-0 border-b border-line bg-transparent py-1 font-mono text-[13.5px] text-text placeholder-text-faint focus:border-accent focus:outline-none"
        />
        <span className="shrink-0 text-text-faint">/</span>
        <input
          type="text"
          value={flags}
          onChange={(e) => setFlags(e.target.value)}
          spellCheck={false}
          placeholder="gi"
          className="w-14 shrink-0 border-0 border-b border-line bg-transparent py-1 font-mono text-[13.5px] text-text placeholder-text-faint focus:border-accent focus:outline-none"
        />
      </div>
      <div className="mb-8">
        {(pattern || flags !== "g") && (
          <ClearButton
            onClick={() => {
              setPattern("");
              setFlags("g");
            }}
          />
        )}
      </div>

      <div className="mb-2 flex items-center justify-between gap-3">
        <h2 className="m-0 text-[13px] text-text-faint">Test string</h2>
        {input && <ClearButton onClick={() => setInput("")} />}
      </div>
      <textarea
        value={input}
        onChange={(e) => setInput(e.target.value)}
        rows={8}
        spellCheck={false}
        placeholder="Text to match against"
        className="mb-8 w-full resize-none border border-line bg-transparent p-3 font-mono text-[13px] text-text placeholder-text-faint focus:border-accent focus:outline-none"
      />

      {error && (
        <p className="mb-8 text-[13px] text-accent">
          Invalid pattern: {error}
        </p>
      )}

      {!error && pattern && (
        <>
          <h2 className="m-0 mb-3 text-[13px] text-text-faint">
            {matches.length === 0
              ? "No matches"
              : `${matches.length} match${matches.length === 1 ? "" : "es"}`}
          </h2>

          {input && (
            <div className="mb-6 overflow-x-auto border border-line p-3 font-mono text-[13px] leading-[1.7] whitespace-pre-wrap break-all text-text">
              {segments.map((seg, i) =>
                seg.matched ? (
                  <mark key={i} className="bg-accent/25 text-text">
                    {seg.text}
                  </mark>
                ) : (
                  <span key={i}>{seg.text}</span>
                ),
              )}
            </div>
          )}

          {matches.length > 0 && (
            <ul className="m-0 list-none border-t border-line p-0">
              {matches.map((m, i) => (
                <li
                  key={i}
                  className="flex flex-col gap-1 border-b border-line py-[10px] text-[13px] sm:flex-row sm:items-baseline sm:justify-between"
                >
                  <span className="shrink-0 text-text-faint">
                    match {i + 1} @ {m.index}
                    {m.groups.length > 0 &&
                      ` · groups: ${m.groups
                        .map((g) => g ?? "—")
                        .join(", ")}`}
                  </span>
                  <span className="flex items-center gap-3">
                    <span className="break-all font-mono text-text">
                      {m.match || "(empty match)"}
                    </span>
                    {m.match && <CopyButton value={m.match} />}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </div>
  );
}
