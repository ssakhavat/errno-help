"use client";

import { useState } from "react";

export function CopyButton({
  value,
  label = "Copy",
}: {
  value: string;
  label?: string;
}) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard API unavailable or permission denied — nothing to do.
    }
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="relative shrink-0 font-mono text-[11px] text-text-faint hover:text-accent"
    >
      {/* Expands the tap target to the ~40x40px touch-target minimum without
          affecting the button's visible size or surrounding layout — this
          sits out of flow (absolute) and is purely a bigger click/tap catcher. */}
      <span className="absolute -inset-3.5" aria-hidden="true" />
      {copied ? "Copied" : label}
    </button>
  );
}
