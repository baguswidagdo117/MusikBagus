import Link from "next/link";
import { cn } from "@/lib/utils";

export function BrandMark({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "relative grid h-10 w-10 place-items-center rounded-xl bg-ink-900 text-brass-300 ring-1 ring-brass-400/40",
        className,
      )}
      aria-hidden
    >
      <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none">
        <path
          d="M9 18V5l10-2v13"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx="6" cy="18" r="3" stroke="currentColor" strokeWidth="1.7" />
        <circle cx="16" cy="16" r="3" stroke="currentColor" strokeWidth="1.7" />
      </svg>
    </span>
  );
}

export function Brand({
  href = "/",
  className,
  light = false,
}: {
  href?: string;
  className?: string;
  light?: boolean;
}) {
  return (
    <Link
      href={href}
      className={cn("inline-flex items-center gap-3", className)}
      aria-label="BagusMusik"
    >
      <BrandMark />
      <span className="leading-none">
        <span
          className={cn(
            "block font-display text-xl font-bold tracking-tight",
            light ? "text-white" : "text-ink-900",
          )}
        >
          Bagus<span className="text-brass-500">Musik</span>
        </span>
        <span
          className={cn(
            "mt-1 block text-[0.62rem] font-semibold uppercase tracking-[0.22em]",
            light ? "text-slate-400" : "text-ink-600",
          )}
        >
          Service Studio
        </span>
      </span>
    </Link>
  );
}
