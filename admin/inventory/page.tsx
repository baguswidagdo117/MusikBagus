import Link from "next/link";
import { prisma } from "@/lib/db";
import { requirePermission } from "@/lib/auth";
import { hasPermission } from "@/lib/permissions";
import { cn, formatIDR, formatDate } from "@/lib/utils";
import { AdminPageHeader } from "@/components/admin/page-header";
import { EmptyState, StatusBadge } from "@/components/ui";
import { Icon } from "@/components/icons";

export const dynamic = "force-dynamic";

const PER_PAGE = 20;

export default async function InventoryPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; low?: string; page?: string }>;
}) {
  const user = await requirePermission("INVENTORY_VIEW");
  const { q = "", low, page: pageParam } = await searchParams;
  const page = Math.max(1, Number(pageParam) || 1);
  const showLow = low === "1";

  const where = {
    ...(q
      ? {
          OR: [
            { name: { contains: q } },
            { sku: { contains: q } },
            { category: { contains: q } },
          ],
        }
      : {}),
  };

  const allItems = await prisma.inventory.findMany({
    where,
    include: { supplier: true },
    orderBy: { name: "asc" },
  });

  let items = allItems;
  if (showLow) {
    items = allItems.filter((item) => item.stock <= item.minStock);
  }
  if (showLow) {
    items = [...items].sort((a, b) => a.stock - b.stock);
  } else {
    items = [...items].sort((a, b) => a.name.localeCompare(b.name));
  }

  const lowStock = allItems.filter((item) => item.stock <= item.minStock);
  const total = items.length;
  const totalPages = Math.max(1, Math.ceil(total / PER_PAGE));
  const paginatedItems = items.slice((page - 1) * PER_PAGE, page * PER_PAGE);
  const hrefFor = (nextPage: number) => {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (showLow) params.set("low", "1");
    if (nextPage > 1) params.set("page", String(nextPage));
    const query = params.toString();
    return `/admin/inventory${query ? `?${query}` : ""}`;
  };

  return (
    <div>
      <AdminPageHeader
        eyebrow="Data"
        title="Inventaris Stok"
        description="Kelola spare part dan bahan pakai. Item di bawah stok minimum ditandai merah."
        actions={
          hasPermission(user.role, "INVENTORY_CREATE") ? (
            <Link
              href="/admin/inventory/new"
              className="btn-white"
            >
              <Icon name="plus" className="h-4 w-4" />
              Tambah Barang
            </Link>
          ) : null
        }
      />

      <div className="panel overflow-hidden">
        <div className="border-b border-white/10 p-3 sm:p-4">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <form action="/admin/inventory" method="get" className="flex gap-2 flex-1">
              <div className="relative flex-1">
                <Icon
                  name="search"
                  className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500"
                />
                <input
                  name="q"
                  defaultValue={q}
                  placeholder="Cari nama, SKU, kategori..."
                  className="input-dark pl-9"
                  aria-label="Cari inventaris"
                />
              </div>
              <button type="submit" className="btn-white">
                Cari
              </button>
              {q ? (
                <Link href="/admin/inventory" className="btn-ghost-dark">
                  Reset
                </Link>
              ) : null}
            </form>
            <div className="flex items-center gap-2">
              <Link
                href={`/admin/inventory?low=1${q ? `&q=${encodeURIComponent(q)}` : ""}`}
                className={cn(
                  "btn-ghost-dark px-3",
                  showLow && "bg-amber-500/10 text-amber-300 border-amber-500/30",
                )}
              >
                <Icon name="alert" className="h-4 w-4" />
                Stok Menipis ({lowStock.length})
              </Link>
            </div>
          </div>
        </div>

        {items.length ? (
          <>
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full min-w-[760px] text-left text-sm">
                <thead>
                  <tr className="border-b border-white/5 text-[0.65rem] uppercase tracking-wider text-slate-500">
                    <th className="px-4 py-2.5 font-semibold sm:px-5">SKU</th>
                    <th className="px-3 py-2.5 font-semibold">Nama Barang</th>
                    <th className="px-3 py-2.5 font-semibold">Kategori</th>
                    <th className="px-3 py-2.5 font-semibold">Supplier</th>
                    <th className="px-3 py-2.5 text-center font-semibold">Stok</th>
                    <th className="px-3 py-2.5 text-right font-semibold">Harga Jual</th>
                    <th className="px-3 py-2.5 font-semibold">Status</th>
                    <th className="px-4 py-2.5 sm:px-5" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {paginatedItems.map((item) => {
                    const isLow = item.stock <= item.minStock;
                    return (
                      <tr
                        key={item.id}
                        className={cn("hover:bg-white/[0.03]", isLow && "border-l-2 border-l-rose-500/50")}
                      >
                        <td className="px-4 py-3 sm:px-5 font-mono text-xs text-slate-400">
                          {item.sku}
                        </td>
                        <td className="px-3 py-3">
                          <Link
                            href={`/admin/inventory/${item.id}`}
                            className="font-medium text-white hover:text-brass-200"
                          >
                            {item.name}
                          </Link>
                          <p className="text-[0.65rem] text-slate-500">
                            {item.unit}
                          </p>
                        </td>
                        <td className="px-3 py-3 text-slate-400">
                          {item.category}
                        </td>
                        <td className="px-3 py-3 text-slate-400">
                          {item.supplier?.name || "-"}
                        </td>
                        <td className={cn("px-3 py-3 text-center font-medium", isLow ? "text-rose-400" : "text-slate-300")}>
                          {item.stock}
                        </td>
                        <td className="px-3 py-3 text-right text-slate-300">
                          {formatIDR(item.sellPrice)}
                        </td>
                        <td className="px-3 py-3">
                          <span
                            className={cn(
                              "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[0.65rem]",
                              isLow
                                ? "bg-rose-500/10 text-rose-300 ring-rose-500/30"
                                : "bg-emerald-500/10 text-emerald-300 ring-emerald-500/30",
                            )}
                          >
                            {isLow ? "MINIMUM" : "AMAN"}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right sm:px-5">
                          <Link
                            href={`/admin/inventory/${item.id}`}
                            className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 hover:bg-white/5 hover:text-white"
                          >
                            <Icon name="chevron-right" className="h-4 w-4" />
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <ul className="divide-y divide-white/5 md:hidden">
              {paginatedItems.map((item) => {
                const isLow = item.stock <= item.minStock;
                return (
                  <li key={item.id} className="px-4 py-3.5 hover:bg-white/[0.03]">
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <span className="font-mono text-xs text-slate-400 block">{item.sku}</span>
                        <Link
                          href={`/admin/inventory/${item.id}`}
                          className="block truncate text-sm font-semibold text-white hover:text-brass-200"
                        >
                          {item.name}
                        </Link>
                        <span className="text-xs text-slate-500">
                          {item.category} · {item.supplier?.name || "-"}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span
                          className={cn(
                            "rounded-full px-2 py-0.5 text-[0.65rem] font-medium",
                            isLow
                              ? "bg-rose-500/10 text-rose-300"
                              : "bg-emerald-500/10 text-emerald-300",
                          )}
                        >
                          {item.stock} / {item.minStock}
                        </span>
                        <StatusBadge status={isLow ? "UNPAID" : "PAID"} kind="order" />
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          </>
        ) : (
          <div className="p-4">
            <EmptyState
              icon={<Icon name="box" className="h-5 w-5" />}
              title={showLow ? "Tidak ada stok menipis" : "Belum ada barang inventaris"}
              description={
                showLow
                  ? "Semua item stok di atas batas minimum."
                  : "Tambah barang pertama melalui tombol Tambah Barang."
              }
              action={
                hasPermission(user.role, "INVENTORY_CREATE") ? (
                  <Link
                    href="/admin/inventory/new"
                    className="btn-white"
                  >
                    <Icon name="plus" className="h-4 w-4 mr-2" />
                    Tambah Barang
                  </Link>
                ) : null
              }
            />
          </div>
        )}

        {total > 0 ? (
          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-white/10 px-4 py-3 text-xs text-slate-500 sm:px-5">
            <p>
              {(page - 1) * PER_PAGE + 1}–{Math.min(page * PER_PAGE, total)} dari {total} barang
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
