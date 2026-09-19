export function ClearButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="border-b border-line pb-0.5 text-[12px] text-text-faint hover:border-accent hover:text-accent"
    >
      Clear
    </button>
  );
}
