"use client";

import { useState } from "react";
import {
  generatePassword,
  generateUuid,
  type PasswordError,
  type PasswordOptions,
} from "@/lib/random";
import { ToolHeader } from "@/components/ToolHeader";
import { ClearButton } from "@/components/ClearButton";
import { CopyButton } from "@/components/CopyButton";

const DEFAULT_OPTIONS: PasswordOptions = {
  length: 20,
  lowercase: true,
  uppercase: true,
  digits: true,
  symbols: false,
};

export default function UuidPage() {
  // Generated client-side only (crypto randomness can't match between
  // server and client render), so the mismatch is expected and suppressed
  // at the two spans below rather than deferred into an effect.
  const [uuid, setUuid] = useState(() => generateUuid());

  const [length, setLength] = useState(DEFAULT_OPTIONS.length);
  const [lowercase, setLowercase] = useState(DEFAULT_OPTIONS.lowercase);
  const [uppercase, setUppercase] = useState(DEFAULT_OPTIONS.uppercase);
  const [digits, setDigits] = useState(DEFAULT_OPTIONS.digits);
  const [symbols, setSymbols] = useState(DEFAULT_OPTIONS.symbols);
  const [passwordResult, setPasswordResult] = useState<string | PasswordError>(
    () => generatePassword(DEFAULT_OPTIONS),
  );

  const password = typeof passwordResult === "string" ? passwordResult : "";
  const passwordError =
    typeof passwordResult === "string" ? null : passwordResult.error;

  function handleGeneratePassword() {
    setPasswordResult(generatePassword({ length, lowercase, uppercase, digits, symbols }));
  }

  return (
    <div className="mx-auto min-h-screen w-full max-w-[760px] px-6 py-[clamp(20px,5vh,48px)]">
      <ToolHeader />

      <h1 className="m-0 mb-2 font-serif text-[clamp(22px,3.6vw,32px)] leading-[1.28] font-medium tracking-[-0.01em]">
        UUID / password generator
      </h1>
      <p className="m-0 mb-8 max-w-[58ch] text-sm leading-[1.7] text-text-dim">
        Generated locally with the browser&apos;s cryptographic randomness
        (<code className="text-text">crypto.randomUUID</code> and{" "}
        <code className="text-text">crypto.getRandomValues</code>) — never
        <code className="text-text"> Math.random</code>.
      </p>

      <section className="mb-10">
        <h2 className="m-0 mb-3 text-[13px] text-text-faint">UUID v4</h2>
        <div className="flex flex-wrap items-center gap-4">
          <span
            suppressHydrationWarning
            className="break-all font-mono text-[15px] text-text"
          >
            {uuid || "—"}
          </span>
          <button
            type="button"
            onClick={() => setUuid(generateUuid())}
            className="border-b border-line pb-0.5 text-[13px] text-text-dim hover:border-accent hover:text-accent"
          >
            Generate another
          </button>
          {uuid && <CopyButton value={uuid} />}
          {uuid && <ClearButton onClick={() => setUuid("")} />}
        </div>
      </section>

      <section className="border-t border-line pt-8">
        <h2 className="m-0 mb-3 text-[13px] text-text-faint">Password</h2>

        <div className="mb-5 flex flex-wrap items-center gap-x-6 gap-y-3 text-[13px]">
          <label className="flex items-center gap-2">
            <span className="text-text-dim">length</span>
            <input
              type="number"
              min={1}
              max={256}
              value={length}
              onChange={(e) => setLength(Number(e.target.value))}
              className="w-16 border-0 border-b border-line bg-transparent py-1 font-mono text-text focus:border-accent focus:outline-none"
            />
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={lowercase}
              onChange={(e) => setLowercase(e.target.checked)}
            />
            <span className="text-text-dim">a-z</span>
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={uppercase}
              onChange={(e) => setUppercase(e.target.checked)}
            />
            <span className="text-text-dim">A-Z</span>
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={digits}
              onChange={(e) => setDigits(e.target.checked)}
            />
            <span className="text-text-dim">0-9</span>
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={symbols}
              onChange={(e) => setSymbols(e.target.checked)}
            />
            <span className="text-text-dim">!@#$</span>
          </label>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <button
            type="button"
            onClick={handleGeneratePassword}
            className="border-b border-line pb-0.5 text-[13px] text-text-dim hover:border-accent hover:text-accent"
          >
            Generate
          </button>
          {passwordError ? (
            <span className="text-[13px] text-accent">{passwordError}</span>
          ) : (
            <span
              suppressHydrationWarning
              className="break-all font-mono text-[15px] text-text"
            >
              {password || "—"}
            </span>
          )}
          {password && <CopyButton value={password} />}
          {password && <ClearButton onClick={() => setPasswordResult("")} />}
        </div>
      </section>
    </div>
  );
}
