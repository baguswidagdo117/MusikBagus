import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { requirePermission } from "@/lib/auth";
import { hasPermission } from "@/lib/permissions";
import { cn, formatDate, formatDateTime, formatIDR } from "@/lib/utils";
import { AdminPageHeader } from "@/components/admin/page-header";
import { EmptyState, StatCard } from "@/components/ui";
import { Icon } from "@/components/icons";

export const dynamic = "force-dynamic";

export default async function InventoryDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requirePermission("INVENTORY_VIEW");
  const { id } = await params;

  const item = await prisma.inventory.findUnique({
    where: { id },
    include: {
      supplier: true,
      txns: {
        orderBy: { createdAt: "desc" },
        take: 30,
        include: { user: { select: { name: true } } },
      },
      _count: { select: { serviceItems: true, saleItems: true } },
    },
  });

  if (!item) notFound();

  const isLow = item.stock <= item.minStock;
  const totalValue = Number(item.sellPrice) * item.stock;

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-2 text-xs text-slate-500">
        <Link
          href="/admin/inventory"
          className="inline-flex items-center gap-1 font-semibold text-slate-400 hover:text-white"
        >
          <Icon name="arrow-left" className="h-3.5 w-3.5" />
          Inventaris
        </Link>
        <span>/</span>
        <span className="font-mono text-slate-400">{item.sku}</span>
      </div>

      <AdminPageHeader
        title={item.name}
        description={`${item.sku} · ${item.category} · Stok ${item.stock} ${item.unit}`}
        actions={
          <>
            {hasPermission(user.role, "INVENTORY_UPDATE") ? (
              <Link
                href={`/admin/inventory/${item.id}/edit`}
                className="btn-white"
              >
                <Icon name="edit" className="h-4 w-4" />
                Edit
              </Link>
            ) : null}
            {hasPermission(user.role, "INVENTORY_STOCK_IN") ? (
              <Link
                href={`/admin/inventory/${item.id}/stock-in`}
                className="btn-primary"
              >
                <Icon name="plus" className="h-4 w-4" />
                Stok Masuk
              </Link>
            ) : null}
          </>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Stok Saat Ini"
          value={String(item.stock)}
          hint={isLow ? `Minimum ${item.minStock} ${item.unit}` : "Aman"}
          tone={isLow ? "warn" : "good"}
          icon={
            <span className={cn(
              "grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white/5 text-slate-300",
              isLow ? "bg-rose-500/15 text-rose-400" : "bg-emerald-500/15 text-emerald-400",
            )}>
              <Icon name="box" className="h-5 w-5" />
            </span>
          }
        />
        <StatCard
          label="Harga Jual"
          value={formatIDR(item.sellPrice)}
          hint={`per ${item.unit}`}
          icon={<Icon name="wallet" className="h-5 w-5" />}
        />
        <StatCard
          label="Harga Beli"
          value={formatIDR(item.purchasePrice)}
          hint="Modal per unit"
          icon={<Icon name="chart" className="h-5 w-5" />}
        />
        <StatCard
          label="Total Nilai Stok"
          value={formatIDR(totalValue)}
          hint="Harga jual × stok"
          tone="good"
          icon={<Icon name="package" className="h-5 w-5" />}
        />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <section className="panel p-4 sm:p-5">
          <div className="flex flex-col gap-2">
            <p className="text-[0.65rem] font-semibold uppercase tracking-wider text-slate-400">
              SKU
            </p>
            <p className="font-mono text-sm font-semibold text-white">
              {item.sku}
            </p>
          </div>
          <div className="mt-4 flex flex-col gap-2">
            <p className="text-[0.65rem] font-semibold uppercase tracking-wider text-slate-400">
              Kategori
            </p>
            <p className="text-sm text-slate-300">{item.category}</p>
          </div>
          <div className="mt-4 flex flex-col gap-2">
            <p className="text-[0.65rem] font-semibold uppercase tracking-wider text-slate-400">
              Satuan
            </p>
            <p className="text-sm text-slate-300">{item.unit}</p>
          </div>
          <div className="mt-4 flex flex-col gap-2">
            <p className="text-[0.65rem] font-semibold uppercase tracking-wider text-slate-400">
              Supplier
            </p>
            <p className="text-sm text-slate-300">
              {item.supplier?.name || "-"}
            </p>
          </div>
          <div className="mt-4 flex flex-col gap-2">
            <p className="text-[0.65rem] font-semibold uppercase tracking-wider text-slate-400">
              Status
            </p>
            <span
              className={cn(
                "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[0.65rem]",
                item.active
                  ? "bg-emerald-500/10 text-emerald-300 ring-emerald-500/30"
                  : "bg-rose-500/10 text-rose-300 ring-rose-500/30",
              )}
            >
              {item.active ? "Aktif" : "Nonaktif"}
            </span>
          </div>
          <div className="mt-4 flex flex-col gap-2">
            <p className="text-[0.65rem] font-semibold uppercase tracking-wider text-slate-400">
              Terbaru diperbarui
            </p>
            <p className="text-sm text-slate-300">
              {formatDateTime(item.updatedAt)}
            </p>
          </div>
        </section>

        <section className="panel overflow-hidden lg:col-span-2">
          <div className="border-b border-white/10 px-4 py-3.5 sm:px-5">
            <h2 className="font-display text-base font-bold text-white">
              Riwayat Stok
            </h2>
            <p className="text-xs text-slate-500">
              Transaksi masuk, keluar, dan penyesuaian
            </p>
          </div>
          {item.txns.length ? (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] text-left text-sm">
                <thead>
                  <tr className="border-b border-white/5 text-[0.65rem] uppercase tracking-wider text-slate-500">
                    <th className="px-4 py-2.5 font-semibold sm:px-5">Waktu</th>
                    <th className="px-3 py-2.5 font-semibold">Tipe</th>
                    <th className="px-3 py-2.5 font-semibold">Qty</th>
                    <th className="px-3 py-2.5 font-semibold">Catatan</th>
                    <th className="px-3 py-2.5 font-semibold">Petugas</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {item.txns.map((tx) => (
                    <tr key={tx.id} className="hover:bg-white/[0.03]">
                      <td className="px-4 py-3 sm:px-5 text-slate-400 font-mono text-xs">
                        {formatDateTime(tx.createdAt)}
                      </td>
                      <td className="px-3 py-3">
                        <span
                          className={cn(
                            "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[0.65rem]",
                            tx.type === "IN"
                              ? "bg-emerald-500/10 text-emerald-300"
                              : tx.type === "OUT"
                                ? "bg-rose-500/10 text-rose-300"
                                : "bg-amber-500/10 text-amber-300",
                          )}
                        >
                          {tx.type === "IN" ? "Masuk" : tx.type === "OUT" ? "Keluar" : "Penyesuaian"}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-slate-300">
                        {tx.qty} {item.unit}
                      </td>
                      <td className="px-3 py-3 text-slate-400">
                        {tx.note || "-"}
                      </td>
                      <td className="px-3 py-3 text-slate-400">
                        {tx.user?.name || "-"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-4">
              <EmptyState
                title="Belum ada riwayat stok"
                description="Transaksi stok akan tampil di sini."
              />
            </div>
          )}
        </section>
      </div>

      <div className="mt-4 rounded-xl border border-white/10 bg-white/[0.02] p-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-display text-base font-bold text-white">
              Digunakan pada
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Work order dan transaksi POS yang menggunakan barang ini
            </p>
          </div>
        </div>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <div className="rounded-lg border border-white/10 p-3">
            <p className="text-[0.65rem] uppercase tracking-wider text-slate-400 mb-1">
              Work Order Items
            </p>
            <p className="text-sm font-semibold text-white">
              {item._count.serviceItems} kali digunakan
            </p>
          </div>
          <div className="rounded-lg border border-white/10 p-3">
            <p className="text-[0.65rem] uppercase tracking-wider text-slate-400 mb-1">
              POS Sale Items
            </p>
            <p className="text-sm font-semibold text-white">
              {item._count.saleItems} kali terjual
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
