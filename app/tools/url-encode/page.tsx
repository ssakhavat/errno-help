"use client";

import { useState } from "react";
import { encodeUrlText, decodeUrlText, isConvertError } from "@/lib/urlEncode";
import { ToolHeader } from "@/components/ToolHeader";
import { ClearButton } from "@/components/ClearButton";
import { CopyButton } from "@/components/CopyButton";

export default function UrlEncodePage() {
  const [text, setText] = useState("");
  const [encoded, setEncoded] = useState("");
  const [error, setError] = useState<string | null>(null);

  function encode() {
    const result = encodeUrlText(text);
    if (isConvertError(result)) {
      setError(result.error);
    } else {
      setEncoded(result);
      setError(null);
    }
  }

  function decode() {
    const result = decodeUrlText(encoded);
    if (isConvertError(result)) {
      setError(result.error);
    } else {
      setText(result);
      setError(null);
    }
  }

  return (
    <div className="mx-auto min-h-screen w-full max-w-[760px] px-6 py-[clamp(20px,5vh,48px)]">
      <ToolHeader />

      <h1 className="m-0 mb-2 font-serif text-[clamp(22px,3.6vw,32px)] leading-[1.28] font-medium tracking-[-0.01em]">
        URL encode / decode
      </h1>
      <p className="m-0 mb-8 max-w-[58ch] text-sm leading-[1.7] text-text-dim">
        Converts entirely in your browser with{" "}
        <code className="text-text">encodeURIComponent</code>/
        <code className="text-text">decodeURIComponent</code>. Nothing you
        type here leaves your browser.
      </p>

      {error && <p className="mb-6 text-[13px] text-accent">{error}</p>}

      <div className="flex flex-col gap-8 sm:flex-row">
        <div className="flex-1">
          <div className="mb-2 flex items-center justify-between gap-3">
            <h2 className="m-0 text-[13px] text-text-faint">Text</h2>
            <div className="flex items-center gap-3">
              {text && <CopyButton value={text} />}
              {text && (
                <ClearButton
                  onClick={() => {
                    setText("");
                    setError(null);
                  }}
                />
              )}
              <button
                type="button"
                onClick={encode}
                className="border-b border-line pb-0.5 text-[12px] text-text-dim hover:border-accent hover:text-accent"
              >
                Encode →
              </button>
            </div>
          </div>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={10}
            spellCheck={false}
            placeholder="Text or URL to encode"
            className="w-full resize-none border border-line bg-transparent p-3 font-mono text-[13px] text-text placeholder-text-faint focus:border-accent focus:outline-none"
          />
        </div>

        <div className="flex-1">
          <div className="mb-2 flex items-center justify-between gap-3">
            <h2 className="m-0 text-[13px] text-text-faint">Encoded</h2>
            <div className="flex items-center gap-3">
              {encoded && <CopyButton value={encoded} />}
              {encoded && (
                <ClearButton
                  onClick={() => {
                    setEncoded("");
                    setError(null);
                  }}
                />
              )}
              <button
                type="button"
                onClick={decode}
                className="border-b border-line pb-0.5 text-[12px] text-text-dim hover:border-accent hover:text-accent"
              >
                ← Decode
              </button>
            </div>
          </div>
          <textarea
            value={encoded}
            onChange={(e) => setEncoded(e.target.value)}
            rows={10}
            spellCheck={false}
            placeholder="Encode the text on the left, or paste an encoded string here."
            className="w-full resize-none border border-line bg-transparent p-3 font-mono text-[13px] text-text placeholder-text-faint focus:border-accent focus:outline-none"
          />
        </div>
      </div>
    </div>
  );
}
