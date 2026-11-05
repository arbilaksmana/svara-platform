import { cx } from "./ui";

/** Wordmark: an audio-wave mark for "svara" (voice), the students' voice. */
export function Logo({ inverse = false, compact = false }: { inverse?: boolean; compact?: boolean }) {
  return (
    <span className="inline-flex items-center gap-2.5">
      <span
        aria-hidden
        className={cx(
          "inline-flex size-8 items-center justify-center rounded-lg",
          inverse ? "bg-fg-inverse text-fg" : "bg-accent text-fg-inverse",
        )}
      >
        <svg viewBox="0 0 20 20" className="size-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <path d="M4 8v4M8 5v10M12 7v6M16 9v2" />
        </svg>
      </span>
      <span className={cx("leading-tight", inverse ? "text-fg-inverse" : "text-fg")}>
        <span className="block font-semibold tracking-[-0.01em]">Svara</span>
        {!compact && <span className={cx("block text-xs", inverse ? "text-fg-inverse/70" : "text-fg-muted")}>Survei SMK Lugina</span>}
      </span>
    </span>
  );
}
