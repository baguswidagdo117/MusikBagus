import { cn, formatIDR } from "@/lib/utils";

export type RevenuePoint = {
  label: string;
  value: number;
  highlight?: boolean;
};

export function RevenueChart({
  data,
  total,
}: {
  data: RevenuePoint[];
  total: number;
}) {
  const max = Math.max(...data.map((point) => point.value), 1);

  return (
    <div>
      <div className="flex items-end gap-2 sm:gap-3">
        {data.map((point, index) => {
          const height = Math.max(
            point.value > 0 ? 6 : 2,
            Math.round((point.value / max) * 100),
          );
          return (
            <div
              key={`${point.label}-${index}`}
              className="group flex min-w-0 flex-1 flex-col items-center gap-2"
            >
              <div className="relative flex h-40 w-full items-end justify-center sm:h-48">
                <div className="pointer-events-none absolute -top-1 left-1/2 z-10 hidden -translate-x-1/2 whitespace-nowrap rounded-md bg-ink-800 px-2 py-1 text-[0.65rem] font-semibold text-white shadow-md group-hover:block">
                  {formatIDR(point.value)}
                </div>
                <div
                  className={cn(
                    "w-full max-w-10 rounded-t-md transition-all",
                    point.highlight
                      ? "bg-gradient-to-t from-brass-600 to-brass-300"
                      : "bg-gradient-to-t from-brass-700/70 to-brass-500/50 group-hover:to-brass-400/70",
                  )}
                  style={{ height: `${height}%` }}
                />
              </div>
              <span
                className={cn(
                  "truncate text-[0.65rem] font-medium",
                  point.highlight ? "text-brass-300" : "text-slate-500",
                )}
              >
                {point.label}
              </span>
            </div>
          );
        })}
      </div>
      <div className="mt-4 flex items-center justify-between border-t border-white/10 pt-3 text-xs text-slate-500">
        <span>7 hari terakhir</span>
        <span className="font-semibold text-slate-300">
          {formatIDR(total)}
        </span>
      </div>
    </div>
  );
}
