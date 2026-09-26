"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { detectToolForInput, TOOL_ROUTES } from "@/lib/detectInputType";

export const OPEN_SEARCH_EVENT = "errno:open-search";

export function GlobalSearch() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((prev) => {
          const next = !prev;
          if (next) setValue("");
          return next;
        });
      } else if (e.key === "Escape") {
        setOpen(false);
      }
    }
    function onOpenRequest() {
      setValue("");
      setOpen(true);
    }
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener(OPEN_SEARCH_EVENT, onOpenRequest);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener(OPEN_SEARCH_EVENT, onOpenRequest);
    };
  }, []);

  // Focus is a DOM effect, not state — runs after the input element exists.
  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  if (!open) return null;

  const trimmed = value.trim();
  const detected = trimmed ? detectToolForInput(trimmed) : null;

  function go() {
    if (!trimmed) return;
    if (detected) {
      router.push(`${TOOL_ROUTES[detected]}?q=${encodeURIComponent(trimmed)}`);
    } else {
      router.push(`/tools?unrecognized=${encodeURIComponent(trimmed)}`);
    }
    setOpen(false);
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-bg/80 px-6 pt-[max(15vh,40px)]"
      onClick={() => setOpen(false)}
    >
      <div
        className="w-full max-w-[480px] border border-line bg-bg p-4"
        onClick={(e) => e.stopPropagation()}
      >
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") go();
          }}
          placeholder="0x8007000E, 192.168.1.0/24, or a JWT"
          spellCheck={false}
          className="w-full border-0 bg-transparent font-mono text-[15px] text-text placeholder-text-faint focus:outline-none"
        />
        <div className="mt-3 flex items-center justify-between border-t border-line pt-3 text-[12px] text-text-faint">
          <span>
            {trimmed
              ? detected
                ? `↵ go to ${TOOL_ROUTES[detected]}`
                : "↵ not recognized — browse all tools"
              : "type a code, then press ↵"}
          </span>
          <span>esc to close</span>
        </div>
      </div>
    </div>
  );
}
