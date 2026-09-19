import Link from "next/link";

export function ToolHeader() {
  return (
    <div className="flex shrink-0 items-baseline justify-between pb-10">
      <Link href="/" className="text-base tracking-[-0.01em]">
        errno<span className="text-text-faint">.help</span>
      </Link>
      <Link
        href="/"
        className="border-b border-line pb-0.5 text-[13px] text-text-dim no-underline hover:border-accent hover:text-accent"
      >
        ← Back
      </Link>
    </div>
  );
}
