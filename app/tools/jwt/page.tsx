"use client";

import { useState } from "react";
import { decodeJwt, isJwtError } from "@/lib/jwt";
import { ToolHeader } from "@/components/ToolHeader";
import { ClearButton } from "@/components/ClearButton";
import { CopyButton } from "@/components/CopyButton";

const SAMPLE_PLACEHOLDER =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c";

export default function JwtPage() {
  const [value, setValue] = useState("");
  const result = value.trim() ? decodeJwt(value) : null;
  const error = result && isJwtError(result) ? result.error : null;
  const decoded = result && !isJwtError(result) ? result : null;

  return (
    <div className="mx-auto min-h-screen w-full max-w-[760px] px-6 py-[clamp(20px,5vh,48px)]">
      <ToolHeader />

      <h1 className="m-0 mb-2 font-serif text-[clamp(22px,3.6vw,32px)] leading-[1.28] font-medium tracking-[-0.01em]">
        JWT decoder
      </h1>
      <p className="m-0 mb-4 max-w-[58ch] text-sm leading-[1.7] text-text-dim">
        Paste a JSON Web Token to inspect its header and payload. Decoding
        happens entirely in your browser — the token is never sent anywhere.
      </p>
      <p className="m-0 mb-8 text-[12px] text-text-faint">
        ✓ Decoded locally. This does not verify the signature.
      </p>

      <textarea
        value={value}
        onChange={(e) => setValue(e.target.value)}
        rows={4}
        spellCheck={false}
        placeholder={SAMPLE_PLACEHOLDER}
        className="mb-2 w-full resize-none border-0 border-b border-line bg-transparent py-1 font-mono text-[13px] text-text placeholder-text-faint focus:border-accent focus:outline-none"
      />
      <div className="mb-8">
        {value && <ClearButton onClick={() => setValue("")} />}
      </div>

      {error && <p className="text-[13px] text-accent">{error}</p>}

      {decoded && (
        <div className="flex flex-col gap-8">
          <div>
            <div className="mb-2 flex items-center justify-between gap-3">
              <h2 className="m-0 text-[13px] text-text-faint">Header</h2>
              <CopyButton value={JSON.stringify(decoded.header, null, 2)} />
            </div>
            <pre className="overflow-x-auto border-t border-line pt-3 font-mono text-[13px] text-text">
              {JSON.stringify(decoded.header, null, 2)}
            </pre>
          </div>
          <div>
            <div className="mb-2 flex items-center justify-between gap-3">
              <h2 className="m-0 text-[13px] text-text-faint">Payload</h2>
              <CopyButton value={JSON.stringify(decoded.payload, null, 2)} />
            </div>
            <pre className="overflow-x-auto border-t border-line pt-3 font-mono text-[13px] text-text">
              {JSON.stringify(decoded.payload, null, 2)}
            </pre>
          </div>
          <p className="m-0 text-[12px] text-text-faint">
            Signature segment{" "}
            {decoded.signaturePresent ? "present" : "empty"} — not verified.
          </p>
        </div>
      )}
    </div>
  );
}
