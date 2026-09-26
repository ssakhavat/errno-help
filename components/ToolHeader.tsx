"use client";

import Link from "next/link";
import { OPEN_SEARCH_EVENT } from "@/components/GlobalSearch";

export function ToolHeader() {
  return (
    <div className="flex shrink-0 items-baseline justify-between pb-10">
      <Link href="/" className="text-base tracking-[-0.01em]">
        errno<span className="text-text-faint">.help</span>
      </Link>
      <div className="flex items-baseline gap-4">
        <button
          type="button"
          onClick={() => window.dispatchEvent(new Event(OPEN_SEARCH_EVENT))}
          className="border-b border-line pb-0.5 text-[13px] text-text-dim hover:border-accent hover:text-accent"
        >
          Search <span className="text-text-faint">⌘K</span>
        </button>
        <Link
          href="/"
          className="border-b border-line pb-0.5 text-[13px] text-text-dim no-underline hover:border-accent hover:text-accent"
        >
          ← Back
        </Link>
      </div>
    </div>
  );
}
