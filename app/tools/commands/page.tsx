import Link from "next/link";
import { ToolHeader } from "@/components/ToolHeader";

const builders = [
  { name: "Robocopy builder", desc: "mirror, subdirs, retries, excludes", href: "/tools/robocopy" },
  { name: "chmod builder", desc: "octal and symbolic permissions", href: "/tools/chmod" },
  { name: "kubectl builder", desc: "get, describe, logs, exec, delete, apply", href: "/tools/kubectl" },
];

export default function CommandsPage() {
  return (
    <div className="mx-auto min-h-screen w-full max-w-[760px] px-6 py-[clamp(20px,5vh,48px)]">
      <ToolHeader />

      <h1 className="m-0 mb-2 font-serif text-[clamp(22px,3.6vw,32px)] leading-[1.28] font-medium tracking-[-0.01em]">
        Command builders
      </h1>
      <p className="m-0 mb-8 max-w-[58ch] text-sm leading-[1.7] text-text-dim">
        Structured forms that generate the command for you — deterministic,
        no library or API involved.
      </p>

      <ul className="m-0 list-none border-t border-line p-0">
        {builders.map((b) => (
          <li key={b.href} className="border-b border-line py-3">
            <Link
              href={b.href}
              className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 text-text no-underline hover:text-accent"
            >
              <span className="text-[13px]">{b.name}</span>
              <span className="font-mono text-[13px] text-text-faint">
                {b.desc}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
