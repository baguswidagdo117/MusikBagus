import Link from "next/link";
import { prisma } from "@/lib/db";
import { requirePermission } from "@/lib/auth";
import { hasPermission } from "@/lib/permissions";
import { cn, formatIDR } from "@/lib/utils";
import { AdminPageHeader } from "@/components/admin/page-header";
import { EmptyState } from "@/components/ui";
import { Icon } from "@/components/icons";

export const dynamic = "force-dynamic";

const PER_PAGE = 20;

export default async function ServicesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string }>;
}) {
  const user = await requirePermission("SERVICE_VIEW");
  const { q = "", page: pageParam } = await searchParams;
  const page = Math.max(1, Number(pageParam) || 1);

  const where = q
    ? {
        OR: [
          { name: { contains: q } },
          { code: { contains: q } },
          { category: { contains: q } },
        ],
      }
    : {};

  const [items, total] = await Promise.all([
    prisma.service.findMany({
      where,
      orderBy: [{ category: "asc" }, { name: "asc" }],
      skip: (page - 1) * PER_PAGE,
      take: PER_PAGE,
    }),
    prisma.service.count({ where }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / PER_PAGE));
  const hrefFor = (nextPage: number) => {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (nextPage > 1) params.set("page", String(nextPage));
    const query = params.toString();
    return `/admin/services${query ? `?${query}` : ""}`;
  };

  return (
    <div>
      <AdminPageHeader
        eyebrow="Data"
        title="Layanan Servis"
        description="Katalog layanan dan harga yang ditawarkan BagusMusik."
        actions={
          hasPermission(user.role, "SERVICE_CREATE") ? (
            <Link href="/admin/services/new" className="btn-white">
              <Icon name="plus" className="h-4 w-4" />
              Tambah Layanan
            </Link>
          ) : null
        }
      />

      <div className="panel overflow-hidden">
        <div className="border-b border-white/10 p-3 sm:p-4">
          <form action="/admin/services" method="get" className="flex gap-2">
            <div className="relative flex-1">
              <Icon
                name="search"
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500"
              />
              <input
                name="q"
                defaultValue={q}
                placeholder="Cari nama, kode, kategori..."
                className="input-dark pl-9"
                aria-label="Cari layanan"
              />
            </div>
            <button type="submit" className="btn-white">Cari</button>
            {q ? (
              <Link href="/admin/services" className="btn-ghost-dark">
                Reset
              </Link>
            ) : null}
          </form>
        </div>

        {items.length ? (
          <>
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full min-w-[760px] text-left text-sm">
                <thead>
                  <tr className="border-b border-white/5 text-[0.65rem] uppercase tracking-wider text-slate-500">
                    <th className="px-4 py-2.5 font-semibold sm:px-5">Kode</th>
                    <th className="px-3 py-2.5 font-semibold">Layanan</th>
                    <th className="px-3 py-2.5 font-semibold">Kategori</th>
                    <th className="px-3 py-2.5 font-semibold">Harga</th>
                    <th className="px-3 py-2.5 text-center font-semibold">Durasi</th>
                    <th className="px-3 py-2.5 font-semibold">Status</th>
                    <th className="px-4 py-2.5 sm:px-5" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {items.map((service) => (
                    <tr key={service.id} className="hover:bg-white/[0.03]">
                      <td className="px-4 py-3 sm:px-5 font-mono text-xs text-slate-400">
                        {service.code}
                      </td>
                      <td className="px-3 py-3">
                        <Link
                          href={`/admin/services/${service.id}`}
                          className="font-medium text-white hover:text-brass-200"
                        >
                          {service.name}
                        </Link>
                        <p className="text-[0.65rem] text-slate-500">
                          {service.description || "-"}
                        </p>
                      </td>
                      <td className="px-3 py-3 text-slate-400">
                        {service.category}
                      </td>
                      <td className="px-3 py-3 text-slate-300">
                        {formatIDR(service.price)}
                      </td>
                      <td className="px-3 py-3 text-center text-slate-400">
                        {service.durationMin} menit
                      </td>
                      <td className="px-3 py-3">
                        <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[0.65rem] bg-emerald-500/10 text-emerald-300 ring-emerald-500/30">
                          {service.active ? "Aktif" : "Nonaktif"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right sm:px-5">
                        <Link
                          href={`/admin/services/${service.id}`}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 hover:bg-white/5 hover:text-white"
                        >
                          <Icon name="chevron-right" className="h-4 w-4" />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <ul className="divide-y divide-white/5 md:hidden">
              {items.map((service) => (
                <li key={service.id}>
                  <Link
                    href={`/admin/services/${service.id}`}
                    className="flex items-center gap-3 px-4 py-3.5 hover:bg-white/[0.03]"
                  >
                    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-brass-500/15 text-xs font-bold text-brass-200">
                      {service.code}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold text-white">
                        {service.name}
                      </span>
                      <span className="block text-xs text-slate-500">
                        {service.category} · {formatIDR(service.price)}
                      </span>
                    </span>
                    <Icon name="chevron-right" className="h-4 w-4 text-slate-600" />
                  </Link>
                </li>
              ))}
            </ul>
          </>
        ) : (
          <div className="p-4">
            <EmptyState
              icon={<Icon name="tune" className="h-5 w-5" />}
              title="Belum ada layanan"
              description={
                q
                  ? "Tidak ada hasil untuk pencarian tersebut."
                  : "Tambah layanan pertama melalui tombol Tambah Layanan."
              }
              action={
                hasPermission(user.role, "SERVICE_CREATE") ? (
                  <Link href="/admin/services/new" className="btn-white">
                    <Icon name="plus" className="h-4 w-4 mr-2" />
                    Tambah Layanan
                  </Link>
                ) : null
              }
            />
          </div>
        )}

        {total > 0 ? (
          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-white/10 px-4 py-3 text-xs text-slate-500 sm:px-5">
            <p>
              {(page - 1) * PER_PAGE + 1}–{Math.min(page * PER_PAGE, total)} dari {total} layanan
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
