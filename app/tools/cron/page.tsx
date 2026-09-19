"use client";

import { useState } from "react";
import { describeCron, isCronError } from "@/lib/cron";
import { ToolHeader } from "@/components/ToolHeader";
import { ClearButton } from "@/components/ClearButton";
import { CopyButton } from "@/components/CopyButton";

const EXAMPLES = [
  "* * * * *",
  "*/15 9-17 * * 1-5",
  "0 0 * * *",
  "0 5 1 * *",
  "30 2 * * 0",
];

export default function CronPage() {
  const [value, setValue] = useState("");
  const result = value.trim() ? describeCron(value) : null;
  const error = result && isCronError(result) ? result.error : null;
  const description = result && !isCronError(result) ? result : null;

  return (
    <div className="mx-auto min-h-screen w-full max-w-[760px] px-6 py-[clamp(20px,5vh,48px)]">
      <ToolHeader />

      <h1 className="m-0 mb-2 font-serif text-[clamp(22px,3.6vw,32px)] leading-[1.28] font-medium tracking-[-0.01em]">
        Cron parser
      </h1>
      <p className="m-0 mb-8 max-w-[58ch] text-sm leading-[1.7] text-text-dim">
        Enter a 5-field cron expression to get a plain-English description of
        its schedule. Runs entirely in your browser.
      </p>

      <div className="mb-4 flex items-center gap-2.5 text-[13.5px]">
        <span className="text-text-faint">cron:</span>
        <input
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="*/15 9-17 * * 1-5"
          spellCheck={false}
          className="w-full max-w-[340px] border-0 border-b border-line bg-transparent py-1 font-mono text-[13.5px] text-text placeholder-text-faint focus:border-accent focus:outline-none"
        />
        {value && <ClearButton onClick={() => setValue("")} />}
      </div>

      <div className="mb-8 flex flex-wrap gap-3 text-[12px]">
        {EXAMPLES.map((example) => (
          <button
            key={example}
            type="button"
            onClick={() => setValue(example)}
            className="border-b border-line pb-0.5 font-mono text-text-dim hover:border-accent hover:text-accent"
          >
            {example}
          </button>
        ))}
      </div>

      {error && <p className="text-[13px] text-accent">{error}</p>}
      {description && (
        <div className="flex items-start justify-between gap-3 border-t border-line pt-6">
          <p className="m-0 font-serif text-[19px] leading-[1.5] text-text">
            {description}
          </p>
          <CopyButton value={description} />
        </div>
      )}
    </div>
  );
}
