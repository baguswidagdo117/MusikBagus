import { cn } from "@/lib/utils";
import { STATUS_STYLE, statusLabel } from "@/lib/status";
import type { ReactNode } from "react";

export function StatusBadge({
  status,
  kind = "booking",
  className,
}: {
  status: string;
  kind?: "booking" | "order";
  className?: string;
}) {
  return (
    <span
      className={cn(
        "badge",
        STATUS_STYLE[status] || "bg-slate-500/10 text-slate-300 ring-slate-500/30",
        className,
      )}
    >
      {statusLabel(status, kind)}
    </span>
  );
}

export function EmptyState({
  title,
  description,
  action,
  icon,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
  icon?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-white/10 bg-white/[0.02] px-6 py-12 text-center">
      {icon ? (
        <div className="mb-4 grid h-12 w-12 place-items-center rounded-full bg-brass-500/10 text-brass-300">
          {icon}
        </div>
      ) : null}
      <p className="font-semibold text-slate-200">{title}</p>
      {description ? (
        <p className="mt-1 max-w-md text-sm text-slate-400">{description}</p>
      ) : null}
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}

export function SectionTitle({
  title,
  description,
  action,
  className,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-wrap items-end justify-between gap-3",
        className,
      )}
    >
      <div>
        <h2 className="font-display text-xl font-bold text-white sm:text-2xl">
          {title}
        </h2>
        {description ? (
          <p className="mt-1 text-sm text-slate-400">{description}</p>
        ) : null}
      </div>
      {action}
    </div>
  );
}

export function StatCard({
  label,
  value,
  hint,
  icon,
  tone = "default",
}: {
  label: string;
  value: string;
  hint?: string;
  icon?: ReactNode;
  tone?: "default" | "good" | "warn" | "bad";
}) {
  return (
    <div className="panel relative overflow-hidden p-4">
      <div
        className={cn(
          "absolute -right-8 -top-8 h-24 w-24 rounded-full blur-2xl",
          tone === "good" && "bg-emerald-500/15",
          tone === "warn" && "bg-amber-500/15",
          tone === "bad" && "bg-rose-500/15",
          tone === "default" && "bg-brass-500/10",
        )}
      />
      <div className="relative flex items-start justify-between gap-3">
        <div>
          <p className="text-[0.7rem] font-semibold uppercase tracking-wider text-slate-400">
            {label}
          </p>
          <p className="mt-2 font-display text-2xl font-bold text-white">{value}</p>
          {hint ? <p className="mt-1 text-xs text-slate-500">{hint}</p> : null}
        </div>
        {icon ? (
          <span
            className={cn(
              "grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white/5 text-slate-300",
              tone === "good" && "text-emerald-300",
              tone === "warn" && "text-amber-300",
              tone === "bad" && "text-rose-300",
              tone === "default" && "text-brass-300",
            )}
          >
            {icon}
          </span>
        ) : null}
      </div>
    </div>
  );
}

export function Divider({ className }: { className?: string }) {
  return <hr className={cn("border-white/10", className)} />;
}

export function PublicBadge({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-brass-500/30 bg-brass-500/10 px-3 py-1 text-[0.7rem] font-semibold uppercase tracking-wider text-brass-700">
      {children}
    </span>
  );
}
