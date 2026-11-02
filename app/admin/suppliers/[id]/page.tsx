import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { requirePermission } from "@/lib/auth";
import { formatDateTime, formatIDR } from "@/lib/utils";
import { AdminPageHeader } from "@/components/admin/page-header";
import { EmptyState, StatCard } from "@/components/ui";
import { Icon } from "@/components/icons";

export const dynamic = "force-dynamic";

export default async function SupplierDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requirePermission("SUPPLIER_VIEW");
  const { id } = await params;

  const supplier = await prisma.supplier.findUnique({
    where: { id },
    include: {
      inventory: {
        select: {
          id: true,
          name: true,
          sku: true,
          stock: true,
          sellPrice: true,
        },
      },
      _count: { select: { inventory: true } },
    },
  });

  if (!supplier) notFound();

  const lowStock = supplier.inventory.filter((i) => i.stock <= 5);
  const totalInventoryValue = supplier.inventory.reduce(
    (sum, i) => sum + Number(i.sellPrice) * i.stock,
    0,
  );

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-2 text-xs text-slate-500">
        <Link
          href="/admin/suppliers"
          className="inline-flex items-center gap-1 font-semibold text-slate-400 hover:text-white"
        >
          <Icon name="arrow-left" className="h-3.5 w-3.5" />
          Supplier
        </Link>
        <span>/</span>
        <span className="font-mono text-slate-400">{supplier.name}</span>
      </div>

      <AdminPageHeader
        title={supplier.name}
        description={`Kontak: ${supplier.contact || "-"} · ${supplier._count.inventory} barang`}
        actions={
          <>
            <a
              href={`https://wa.me/${supplier.phone?.replace(/\D/g, "") || ""}`}
              target="_blank"
              rel="noreferrer"
              className="btn-white"
            >
              <Icon name="whatsapp" className="h-4 w-4" />
              WhatsApp
            </a>
            {supplier.email ? (
              <a
                href={`mailto:${supplier.email}`}
                className="btn-ghost-dark"
              >
                <Icon name="external" className="h-4 w-4" />
                Email
              </a>
            ) : null}
          </>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Barang"
          value={String(supplier._count.inventory)}
          hint={`${lowStock.length} stok menipis`}
          tone={lowStock.length > 0 ? "warn" : "good"}
          icon={<Icon name="box" className="h-5 w-5" />}
        />
        <StatCard
          label="Nilai Stok"
          value={formatIDR(totalInventoryValue)}
          hint="Harga jual × stok"
          tone="good"
          icon={<Icon name="wallet" className="h-5 w-5" />}
        />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <section className="panel p-4 sm:p-5">
          <div className="flex flex-col gap-2">
            <p className="text-[0.65rem] font-semibold uppercase tracking-wider text-slate-400">
              Kontak
            </p>
            <p className="text-sm font-semibold text-white">
              {supplier.contact || "-"}
            </p>
          </div>
          <div className="mt-4 flex flex-col gap-2">
            <p className="text-[0.65rem] font-semibold uppercase tracking-wider text-slate-400">
              Telepon
            </p>
            <p className="text-sm text-slate-300 font-mono">
              {supplier.phone || "-"}
            </p>
          </div>
          <div className="mt-4 flex flex-col gap-2">
            <p className="text-[0.65rem] font-semibold uppercase tracking-wider text-slate-400">
              Email
            </p>
            <p className="text-sm text-slate-300 font-mono">
              {supplier.email || "-"}
            </p>
          </div>
          <div className="mt-4 flex flex-col gap-2">
            <p className="text-[0.65rem] font-semibold uppercase tracking-wider text-slate-400">
              Alamat
            </p>
            <p className="text-sm whitespace-pre-line text-slate-300">
              {supplier.address || "-"}
            </p>
          </div>
          <div className="mt-4 flex flex-col gap-2">
            <p className="text-[0.65rem] font-semibold uppercase tracking-wider text-slate-400">
              Terdaftar
            </p>
            <p className="text-sm text-slate-300">
              {formatDateTime(supplier.createdAt)}
            </p>
          </div>
        </section>

        <section className="panel overflow-hidden lg:col-span-2">
          <div className="border-b border-white/10 px-4 py-3.5 sm:px-5">
            <h2 className="font-display text-base font-bold text-white">
              Barang dari Supplier
            </h2>
            <p className="text-xs text-slate-500">
              Daftar inventaris yang disuplai
            </p>
          </div>
          {supplier.inventory.length ? (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] text-left text-sm">
                <thead>
                  <tr className="border-b border-white/5 text-[0.65rem] uppercase tracking-wider text-slate-500">
                    <th className="px-4 py-2.5 font-semibold sm:px-5">SKU</th>
                    <th className="px-3 py-2.5 font-semibold">Nama Barang</th>
                    <th className="px-3 py-2.5 text-center font-semibold">Stok</th>
                    <th className="px-3 py-2.5 text-right font-semibold">Harga Jual</th>
                    <th className="px-4 py-2.5 sm:px-5" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {supplier.inventory.map((item) => (
                    <tr key={item.id} className="hover:bg-white/[0.03]">
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
                      </td>
                      <td className="px-3 py-3 text-center text-slate-300">
                        {item.stock}
                      </td>
                      <td className="px-3 py-3 text-right text-slate-300">
                        {formatIDR(item.sellPrice)}
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
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-4">
              <EmptyState
                title="Belum ada barang"
                description="Supplier ini belum memiliki barang inventaris."
              />
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
