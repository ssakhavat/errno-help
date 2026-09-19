"use client";

import { useState } from "react";
import { buildChmod, isChmodError, type ChmodPermissions } from "@/lib/chmod";
import { ToolHeader } from "@/components/ToolHeader";
import { CopyButton } from "@/components/CopyButton";

const DEFAULT_OWNER: ChmodPermissions = { read: true, write: true, execute: true };
const DEFAULT_GROUP: ChmodPermissions = { read: true, write: false, execute: true };
const DEFAULT_OTHER: ChmodPermissions = { read: true, write: false, execute: false };

function PermissionRow({
  label,
  perms,
  onChange,
}: {
  label: string;
  perms: ChmodPermissions;
  onChange: (perms: ChmodPermissions) => void;
}) {
  return (
    <div className="flex items-center gap-6 border-b border-line py-3 text-[13px]">
      <span className="w-16 text-text-dim">{label}</span>
      <label className="flex items-center gap-2">
        <input
          type="checkbox"
          checked={perms.read}
          onChange={(e) => onChange({ ...perms, read: e.target.checked })}
        />
        <span className="text-text-faint">read</span>
      </label>
      <label className="flex items-center gap-2">
        <input
          type="checkbox"
          checked={perms.write}
          onChange={(e) => onChange({ ...perms, write: e.target.checked })}
        />
        <span className="text-text-faint">write</span>
      </label>
      <label className="flex items-center gap-2">
        <input
          type="checkbox"
          checked={perms.execute}
          onChange={(e) => onChange({ ...perms, execute: e.target.checked })}
        />
        <span className="text-text-faint">execute</span>
      </label>
    </div>
  );
}

export default function ChmodPage() {
  const [path, setPath] = useState("./script.sh");
  const [owner, setOwner] = useState(DEFAULT_OWNER);
  const [group, setGroup] = useState(DEFAULT_GROUP);
  const [other, setOther] = useState(DEFAULT_OTHER);
  const [recursive, setRecursive] = useState(false);

  const result = buildChmod({ path, owner, group, other, recursive });
  const error = isChmodError(result) ? result.error : null;
  const data = !isChmodError(result) ? result : null;

  return (
    <div className="mx-auto min-h-screen w-full max-w-[760px] px-6 py-[clamp(20px,5vh,48px)]">
      <ToolHeader />

      <h1 className="m-0 mb-2 font-serif text-[clamp(22px,3.6vw,32px)] leading-[1.28] font-medium tracking-[-0.01em]">
        chmod builder
      </h1>
      <p className="m-0 mb-8 max-w-[58ch] text-sm leading-[1.7] text-text-dim">
        Choose permissions for owner, group, and other to generate both the
        octal and symbolic chmod commands.
      </p>

      <label className="mb-6 flex flex-col gap-1 text-[13px]">
        <span className="text-text-faint">Path</span>
        <input
          type="text"
          value={path}
          onChange={(e) => setPath(e.target.value)}
          spellCheck={false}
          className="w-full max-w-[400px] border-0 border-b border-line bg-transparent py-1 font-mono text-[13.5px] text-text focus:border-accent focus:outline-none"
        />
      </label>

      <div className="mb-4 border-t border-line">
        <PermissionRow label="Owner" perms={owner} onChange={setOwner} />
        <PermissionRow label="Group" perms={group} onChange={setGroup} />
        <PermissionRow label="Other" perms={other} onChange={setOther} />
      </div>

      <label className="mb-8 flex items-center gap-2 text-[13px]">
        <input
          type="checkbox"
          checked={recursive}
          onChange={(e) => setRecursive(e.target.checked)}
        />
        <span className="text-text-dim">Recursive (-R)</span>
      </label>

      {error && <p className="text-[13px] text-accent">{error}</p>}

      {data && (
        <div className="flex flex-col gap-4">
          <div className="flex items-baseline gap-4 text-[13px]">
            <span className="text-text-faint">mode</span>
            <span className="font-mono text-text">
              {data.octal} · -{data.rwx}
            </span>
          </div>
          <div className="flex items-start justify-between gap-3 border-t border-line pt-4">
            <pre className="overflow-x-auto font-mono text-[13px] leading-[1.6] text-text">
              {data.octalCommand}
            </pre>
            <CopyButton value={data.octalCommand} />
          </div>
          <div className="flex items-start justify-between gap-3">
            <pre className="overflow-x-auto font-mono text-[13px] leading-[1.6] text-text">
              {data.symbolicCommand}
            </pre>
            <CopyButton value={data.symbolicCommand} />
          </div>
        </div>
      )}
    </div>
  );
}
