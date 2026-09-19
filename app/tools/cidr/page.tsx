"use client";

import { useState } from "react";
import { calculateCidr, isCidrError } from "@/lib/cidr";
import { ToolHeader } from "@/components/ToolHeader";
import { ClearButton } from "@/components/ClearButton";
import { CopyButton } from "@/components/CopyButton";

export default function CidrPage() {
  const [value, setValue] = useState("");
  const result = value.trim() ? calculateCidr(value) : null;
  const error = result && isCidrError(result) ? result.error : null;
  const data = result && !isCidrError(result) ? result : null;

  const rows: [string, string][] = data
    ? [
        ["CIDR notation", data.cidr],
        ["Network address", data.networkAddress],
        ["Broadcast address", data.broadcastAddress],
        ["Subnet mask", data.subnetMask],
        ["Wildcard mask", data.wildcardMask],
        ["First usable host", data.firstUsable],
        ["Last usable host", data.lastUsable],
        ["Usable hosts", data.usableHosts.toLocaleString()],
        ["Total addresses", data.totalAddresses.toLocaleString()],
      ]
    : [];

  return (
    <div className="mx-auto min-h-screen w-full max-w-[760px] px-6 py-[clamp(20px,5vh,48px)]">
      <ToolHeader />

      <h1 className="m-0 mb-2 font-serif text-[clamp(22px,3.6vw,32px)] leading-[1.28] font-medium tracking-[-0.01em]">
        CIDR / IPv4 calculator
      </h1>
      <p className="m-0 mb-8 max-w-[58ch] text-sm leading-[1.7] text-text-dim">
        Enter an IPv4 address with a prefix length to get the network range,
        masks, and usable host count. Runs entirely in your browser.
      </p>

      <div className="mb-8 flex items-center gap-2.5 text-[13.5px]">
        <span className="text-text-faint">cidr:</span>
        <input
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="192.168.1.0/24"
          spellCheck={false}
          className="w-full max-w-[340px] border-0 border-b border-line bg-transparent py-1 font-mono text-[13.5px] text-text placeholder-text-faint focus:border-accent focus:outline-none"
        />
        {value && <ClearButton onClick={() => setValue("")} />}
      </div>

      {error && <p className="mb-8 text-[13px] text-accent">{error}</p>}

      {rows.length > 0 && (
        <ul className="m-0 list-none border-t border-line p-0">
          {rows.map(([label, val]) => (
            <li
              key={label}
              className="flex justify-between gap-4 border-b border-line py-[7px] text-[13px]"
            >
              <span className="text-text-dim">{label}</span>
              <span className="flex items-center gap-3">
                <span className="font-mono text-text">{val}</span>
                <CopyButton value={val} />
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
