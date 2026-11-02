import Link from "next/link";
import { prisma } from "@/lib/db";
import { requirePermission } from "@/lib/auth";
import { hasPermission, ROLE_LABEL } from "@/lib/permissions";
import { cn, formatDate } from "@/lib/utils";
import { AdminPageHeader } from "@/components/admin/page-header";
import { EmptyState } from "@/components/ui";
import { Icon } from "@/components/icons";

export const dynamic = "force-dynamic";

const PER_PAGE = 20;

const ROLE_COLOR: Record<string, string> = {
  OWNER: "text-amber-400",
  ADMIN: "text-sky-400",
  KASIR: "text-emerald-400",
  TEKNISI: "text-purple-400",
} as const;

export default async function UsersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string }>;
}) {
  const user = await requirePermission("USER_MANAGE");
  const { q = "", page: pageParam } = await searchParams;
  const page = Math.max(1, Number(pageParam) || 1);

  const where = q
    ? {
        OR: [
          { name: { contains: q } },
          { email: { contains: q } },
          { role: { contains: q } },
          { phone: { contains: q } },
        ],
      }
    : {};

  const [items, total] = await Promise.all([
    prisma.user.findMany({
      where,
      orderBy: { name: "asc" },
      skip: (page - 1) * PER_PAGE,
      take: PER_PAGE,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        phone: true,
        active: true,
        createdAt: true,
        technician: true,
        _count: { select: { sales: true, payments: true, inventoryTx: true } },
      },
    }),
    prisma.user.count({ where }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / PER_PAGE));
  const hrefFor = (nextPage: number) => {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (nextPage > 1) params.set("page", String(nextPage));
    const query = params.toString();
    return `/admin/users${query ? `?${query}` : ""}`;
  };

  return (
    <div>
      <AdminPageHeader
        eyebrow="Insight"
        title="Pengguna"
        description="Kelola akun staf dan hak akses (RBAC) BagusMusik."
        actions={
          hasPermission(user.role, "USER_MANAGE") ? (
            <Link href="/admin/users/new" className="btn-white">
              <Icon name="plus" className="h-4 w-4" />
              Tambah Pengguna
            </Link>
          ) : null
        }
      />

      <div className="panel overflow-hidden">
        <div className="border-b border-white/10 p-3 sm:p-4">
          <form action="/admin/users" method="get" className="flex gap-2">
            <div className="relative flex-1">
              <Icon
                name="search"
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500"
              />
              <input
                name="q"
                defaultValue={q}
                placeholder="Cari nama, email, peran, telepon..."
                className="input-dark pl-9"
                aria-label="Cari pengguna"
              />
            </div>
            <button type="submit" className="btn-white">Cari</button>
            {q ? (
              <Link href="/admin/users" className="btn-ghost-dark">
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
                    <th className="px-4 py-2.5 font-semibold sm:px-5">Nama</th>
                    <th className="px-3 py-2.5 font-semibold">Email</th>
                    <th className="px-3 py-2.5 font-semibold">Peran</th>
                    <th className="px-3 py-2.5 font-semibold">Telepon</th>
                    <th className="px-3 py-2.5 text-center font-semibold">Status</th>
                    <th className="px-3 py-2.5 text-center font-semibold">Terdaftar</th>
                    <th className="px-4 py-2.5 sm:px-5" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {items.map((u) => (
                    <tr key={u.id} className="hover:bg-white/[0.03]">
                      <td className="px-4 py-3 sm:px-5">
                        <Link
                          href={`/admin/users/${u.id}`}
                          className="font-medium text-white hover:text-brass-200"
                        >
                          {u.name}
                        </Link>
                        <p className="text-[0.65rem] text-slate-500">
                          {u.technician ? "Teknisi" : "Staf"}
                        </p>
                      </td>
                      <td className="px-3 py-3 text-slate-400 font-mono text-xs">
                        {u.email}
                      </td>
                      <td className="px-3 py-3">
                        <span className={cn("text-xs font-semibold", ROLE_COLOR[u.role as keyof typeof ROLE_COLOR])}>
                          {ROLE_LABEL[u.role as keyof typeof ROLE_LABEL] ?? u.role}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-slate-400">
                        {u.phone || "-"}
                      </td>
                      <td className="px-3 py-3 text-center">
                        <span className={cn(
                          "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[0.65rem]",
                          u.active
                            ? "bg-emerald-500/10 text-emerald-300 ring-emerald-500/30"
                            : "bg-rose-500/10 text-rose-300 ring-rose-500/30",
                        )}>
                          {u.active ? "Aktif" : "Nonaktif"}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-xs text-slate-500">
                        {formatDate(u.createdAt)}
                      </td>
                      <td className="px-4 py-3 text-right sm:px-5">
                        <Link
                          href={`/admin/users/${u.id}`}
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
              {items.map((u) => (
                <li key={u.id}>
                  <Link
                    href={`/admin/users/${u.id}`}
                    className="flex items-center gap-3 px-4 py-3.5 hover:bg-white/[0.03]"
                  >
                    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-brass-500/15 text-xs font-bold text-brass-200">
                      {u.name.split(" ").map((n) => n[0]).join("").toUpperCase()}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold text-white">
                        {u.name}
                      </span>
                      <span className="block text-xs text-slate-500">
                        {u.email} · {ROLE_LABEL[u.role as keyof typeof ROLE_LABEL] ?? u.role}
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
              icon={<Icon name="shield" className="h-5 w-5" />}
              title="Belum ada pengguna"
              description={
                q
                  ? "Tidak ada hasil untuk pencarian tersebut."
                  : "Tambah pengguna pertama melalui tombol Tambah Pengguna."
              }
              action={
                hasPermission(user.role, "USER_MANAGE") ? (
                  <Link href="/admin/users/new" className="btn-white">
                    <Icon name="plus" className="h-4 w-4 mr-2" />
                    Tambah Pengguna
                  </Link>
                ) : null
              }
            />
          </div>
        )}

        {total > 0 ? (
          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-white/10 px-4 py-3 text-xs text-slate-500 sm:px-5">
            <p>
              {(page - 1) * PER_PAGE + 1}–{Math.min(page * PER_PAGE, total)} dari {total} pengguna
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
