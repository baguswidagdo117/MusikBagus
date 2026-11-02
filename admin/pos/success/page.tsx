import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { requirePermission } from "@/lib/auth";
import { formatDateTime, formatIDR } from "@/lib/utils";
import { AdminPageHeader } from "@/components/admin/page-header";
import { Icon } from "@/components/icons";

export const dynamic = "force-dynamic";

export default async function PosSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ sale?: string }>;
}) {
  const user = await requirePermission("POS_VIEW");
  const { sale } = await searchParams;

  const saleData = sale
    ? await prisma.sale.findUnique({
        where: { saleNumber: sale },
        include: {
          customer: true,
          items: true,
          payments: {
            orderBy: { paidAt: "desc" },
          },
          serviceOrder: { select: { orderNumber: true } },
          cashier: { select: { name: true } },
          invoice: true,
        },
      })
    : null;

  if (sale && !saleData) notFound();

  const totalPaid = (saleData?.payments.reduce(
    (sum, p) => sum + Number(p.amount),
    0,
  )) ?? 0;
  const remaining = Math.max(0, Number(saleData?.total || 0) - totalPaid);

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-2 text-xs text-slate-500">
        <Link
          href="/admin/pos"
          className="inline-flex items-center gap-1 font-semibold text-slate-400 hover:text-white"
        >
          <Icon name="arrow-left" className="h-3.5 w-3.5" />
          POS
        </Link>
        <span>/</span>
        <span className="font-mono text-slate-400">Transaksi Berhasil</span>
      </div>

      {!saleData ? (
        <div className="panel rounded-2xl p-6 mx-auto mt-10 max-w-md">
          <div className="text-center">
            <div className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-full bg-emerald-500/15 text-emerald-400">
              <Icon name="check" className="h-8 w-8" />
            </div>
            <h2 className="font-display text-xl font-bold text-white">
              Transaksi Berhasil
            </h2>
            <p className="mt-2 text-sm text-slate-400">
              Silakan buat transaksi baru atau kembali ke halaman POS.
            </p>
            <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                href="/admin/pos"
                className="btn-primary flex-1 sm:w-auto"
              >
                <Icon name="receipt" className="h-4 w-4 mr-2" />
                Transaksi Baru
              </Link>
              <Link
                href="/admin/pos"
                className="btn-ghost-dark flex-1 sm:w-auto"
              >
                Kembali ke POS
              </Link>
            </div>
          </div>
        </div>
      ) : (
        <>
          <AdminPageHeader
            title="Transaksi Berhasil"
            description={`No. ${saleData.saleNumber} · ${formatDateTime(saleData.createdAt)}`}
          />

          <div className="grid gap-4 lg:grid-cols-2">
          <section className="panel rounded-xl p-4 sm:p-6">
            <h2 className="font-display text-lg font-bold text-white mb-4">
              Rincian Transaksi
            </h2>
            <dl className="space-y-3 text-sm">
              <div className="flex justify-between text-slate-400">
                <dt>No. Transaksi</dt>
                <dd className="font-mono text-white">{saleData.saleNumber}</dd>
              </div>
              <div className="flex justify-between text-slate-400">
                <dt>Pelanggan</dt>
                <dd className="text-white">
                  {saleData.customer?.name || "Umum"}
                </dd>
              </div>
              <div className="flex justify-between text-slate-400">
                <dt>Kasir</dt>
                <dd className="text-white">{saleData.cashier?.name || "-"}</dd>
              </div>
              <div className="flex justify-between text-slate-400">
                <dt>Metode</dt>
                <dd className="text-white">{saleData.payments[0]?.method || "-"}</dd>
              </div>
              <div className="flex justify-between text-slate-400">
                <dt>Tanggal</dt>
                <dd className="text-white">{formatDateTime(saleData.createdAt)}</dd>
              </div>
              {saleData.serviceOrder && (
                <div className="flex justify-between text-slate-400">
                  <dt>Work Order</dt>
                  <dd className="font-mono text-white">
                    {saleData.serviceOrder.orderNumber}
                  </dd>
                </div>
              )}
            </dl>
          </section>

          <section className="panel rounded-xl p-4 sm:p-6">
            <h2 className="font-display text-lg font-bold text-white mb-4">
              Ringkasan Pembayaran
            </h2>
            <dl className="space-y-2 text-sm mb-6">
              <div className="flex justify-between">
                <dt className="text-slate-400">Subtotal</dt>
                <dd className="font-mono text-slate-300">
                  {formatIDR(saleData.subtotal)}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-400">Diskon</dt>
                <dd className="font-mono text-rose-400">
                  -{formatIDR(saleData.discount)}
                </dd>
              </div>
              <div className="flex justify-between border-t border-white/10 pt-2 font-semibold text-white">
                <dt>Total</dt>
                <dd className="font-mono">{formatIDR(saleData.total)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-400">Terbayar</dt>
                <dd className="font-mono text-emerald-400">
                  {formatIDR(totalPaid)}
                </dd>
              </div>
              <div className="flex justify-between border-t border-white/10 pt-2 font-bold text-amber-400">
                <dt>Sisa</dt>
                <dd className="font-mono">{formatIDR(remaining)}</dd>
              </div>
            </dl>
            {saleData.invoice && (
              <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-4">
                <p className="text-[0.65rem] font-semibold uppercase tracking-wider text-emerald-400 mb-2">
                  Invoice
                </p>
                <p className="font-mono text-sm text-emerald-300 mb-3">
                  {saleData.invoice.invoiceNumber}
                </p>
                <Link
                  href={`/invoice/${saleData.invoice.invoiceNumber}`}
                  target="_blank"
                  className="inline-flex items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-2 text-xs font-bold text-emerald-300 hover:bg-emerald-500/20"
                >
                  <Icon name="file" className="h-4 w-4" />
                  Cetak Invoice
                </Link>
              </div>
            )}
            <div className="mt-6 flex gap-2">
              <button
                className="flex-1 btn-primary"
                onClick={() => window.print()}
              >
                <Icon name="print" className="h-4 w-4 mr-2" />
                Cetak Nota
              </button>
              <Link
                href="/admin/pos"
                className="btn-ghost-dark flex-1"
              >
                Transaksi Baru
              </Link>
            </div>
          </section>

          <section className="lg:col-span-2 panel rounded-xl p-4 sm:p-6">
            <h2 className="font-display text-lg font-bold text-white mb-3">
              Item Transaksi
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-white/5 text-[0.65rem] uppercase tracking-wider text-slate-500">
                    <th className="px-4 py-2.5 font-semibold sm:px-5">Jenis</th>
                    <th className="px-3 py-2.5 font-semibold">Deskripsi</th>
                    <th className="px-3 py-2.5 text-center font-semibold">Qty</th>
                    <th className="px-3 py-2.5 text-right font-semibold">Harga</th>
                    <th className="px-3 py-2.5 text-right font-semibold">Subtotal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {saleData.items.map((item) => (
                    <tr key={item.id} className="hover:bg-white/[0.03]">
                      <td className="px-4 py-3 sm:px-5 text-slate-400 font-mono text-xs">
                        {item.type === "JASA" ? "Jasa" : item.type === "PART" ? "Part" : "Lainnya"}
                      </td>
                      <td className="px-3 py-3 text-slate-300">
                        {item.description}
                      </td>
                      <td className="px-3 py-3 text-center text-slate-300">
                        {item.qty}
                      </td>
                      <td className="px-3 py-3 text-right text-slate-300">
                        {formatIDR(item.unitPrice)}
                      </td>
                      <td className="px-3 py-3 text-right text-white">
                        {formatIDR(item.subtotal)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>
        </>
      )}
    </div>
  );
}
