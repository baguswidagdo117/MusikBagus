import Link from "next/link";
import { prisma } from "@/lib/db";
import { requirePermission } from "@/lib/auth";
import { cn, formatDateTime } from "@/lib/utils";
import { AdminPageHeader } from "@/components/admin/page-header";
import { EmptyState } from "@/components/ui";
import { Icon } from "@/components/icons";

export const dynamic = "force-dynamic";

const PER_PAGE = 30;

export default async function AuditPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string }>;
}) {
  const user = await requirePermission("AUDIT_VIEW");
  const { q = "", page: pageParam } = await searchParams;
  const page = Math.max(1, Number(pageParam) || 1);

  const where = q
    ? {
        OR: [
          { action: { contains: q } },
          { entity: { contains: q } },
          { user: { name: { contains: q } } },
        ],
      }
    : {};

  const [items, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      include: {
        user: { select: { name: true, email: true, role: true } },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PER_PAGE,
      take: PER_PAGE,
    }),
    prisma.auditLog.count({ where }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / PER_PAGE));
  const hrefFor = (nextPage: number) => {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (nextPage > 1) params.set("page", String(nextPage));
    const query = params.toString();
    return `/admin/audit${query ? `?${query}` : ""}`;
  };

  return (
    <div>
      <AdminPageHeader
        eyebrow="Insight"
        title="Audit Log"
        description="Catatan semua aktivitas penting dalam sistem BagusMusik."
      />

      <div className="panel overflow-hidden">
        <div className="border-b border-white/10 p-3 sm:p-4">
          <form action="/admin/audit" method="get" className="flex gap-2">
            <div className="relative flex-1">
              <Icon
                name="search"
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500"
              />
              <input
                name="q"
                defaultValue={q}
                placeholder="Cari aksi, entitas, atau nama pengguna..."
                className="input-dark pl-9"
                aria-label="Cari audit log"
              />
            </div>
            <button type="submit" className="btn-white">Cari</button>
            {q ? (
              <Link href="/admin/audit" className="btn-ghost-dark">
                Reset
              </Link>
            ) : null}
          </form>
        </div>

        {items.length ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[860px] text-left text-sm">
              <thead>
                <tr className="border-b border-white/5 text-[0.65rem] uppercase tracking-wider text-slate-500">
                  <th className="px-4 py-2.5 font-semibold sm:px-5">Waktu</th>
                  <th className="px-3 py-2.5 font-semibold">Pengguna</th>
                  <th className="px-3 py-2.5 font-semibold">Aksi</th>
                  <th className="px-3 py-2.5 font-semibold">Entitas</th>
                  <th className="px-3 py-2.5 font-semibold">ID Entitas</th>
                  <th className="px-4 py-2.5 sm:px-5" />
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {items.map((log) => (
                  <tr key={log.id} className="hover:bg-white/[0.03]">
                    <td className="px-4 py-3 sm:px-5 text-slate-400 font-mono text-xs">
                      {formatDateTime(log.createdAt)}
                    </td>
                    <td className="px-3 py-3">
                      <div>
                        <span className="text-sm font-medium text-slate-200">
                          {log.user?.name || "-"}
                        </span>
                        <p className="text-[0.65rem] text-slate-500">
                          {log.user?.email || "-"} ·{" "}
                          {log.user?.role || "-"}
                        </p>
                      </div>
                    </td>
                    <td className="px-3 py-3 text-slate-300 font-mono text-xs">
                      {log.action}
                    </td>
                    <td className="px-3 py-3 text-slate-400">{log.entity}</td>
                    <td className="px-3 py-3 text-slate-400 font-mono text-xs">
                      {log.entityId || "-"}
                    </td>
                    <td className="px-4 py-3 text-right sm:px-5">
                      <button
                        className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 hover:bg-white/5 hover:text-white"
                        title="Detail"
                      >
                        <Icon name="chevron-right" className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-4">
            <EmptyState
              icon={<Icon name="history" className="h-5 w-5" />}
              title="Belum ada catatan audit"
              description={
                q
                  ? "Tidak ada hasil untuk pencarian tersebut."
                  : "Aktivitas sistem akan muncul di sini."
              }
            />
          </div>
        )}

        {total > 0 ? (
          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-white/10 px-4 py-3 text-xs text-slate-500 sm:px-5">
            <p>
              {(page - 1) * PER_PAGE + 1}–{Math.min(page * PER_PAGE, total)} dari {total} catatan
            </p>
            <div className="flex items-center gap-1">
              <Link
                href={hrefFor(Math.max(1, page - 1))}
                className={cn("btn-ghost-dark h-8 px-2.5 text-xs", page <= 1 && "pointer-events-none opacity-40")}
              >
                Prev
              </Link>
              <span className="px-2 text-slate-400">{page}/{totalPages}</span>
              <Link
                href={hrefFor(Math.min(totalPages, page + 1))}
                className={cn("btn-ghost-dark h-8 px-2.5 text-xs", page >= totalPages && "pointer-events-none opacity-40")}
              >
                Next
              </Link>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
