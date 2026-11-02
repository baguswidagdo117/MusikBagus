import Link from "next/link";
import { prisma } from "@/lib/db";
import { requirePermission } from "@/lib/auth";
import { cn, formatIDR, formatDate } from "@/lib/utils";
import { AdminPageHeader } from "@/components/admin/page-header";
import { StatCard } from "@/components/ui";
import { Icon } from "@/components/icons";

export const dynamic = "force-dynamic";

export default async function ReportsPage() {
  const user = await requirePermission("REPORT_VIEW");
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);

  const [
    monthSales,
    monthSalesCount,
    monthExpenses,
    totalCustomers,
    activeOrders,
    completedMonth,
    recentSales,
    topServices,
  ] = await Promise.all([
    prisma.sale.aggregate({
      where: { createdAt: { gte: monthStart, lte: monthEnd } },
      _sum: { total: true },
    }),
    prisma.sale.count({
      where: { createdAt: { gte: monthStart, lte: monthEnd } },
    }),
    prisma.expense.aggregate({
      where: { date: { gte: monthStart, lte: monthEnd } },
      _sum: { amount: true },
    }),
    prisma.customer.count(),
    prisma.serviceOrder.count({
      where: { status: { in: ["RECEIVED", "DIAGNOSING", "WAITING_APPROVAL", "IN_PROGRESS"] } },
    }),
    prisma.serviceOrder.count({
      where: {
        status: { in: ["COMPLETED", "READY_FOR_PICKUP", "PAID", "CLOSED"] },
        updatedAt: { gte: monthStart },
      },
    }),
    prisma.sale.findMany({
      include: { customer: true, cashier: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
      take: 10,
    }),
    prisma.serviceItem.groupBy({
      by: ["description"],
      where: { type: "JASA" },
      _sum: { qty: true },
      orderBy: { _sum: { qty: "desc" } },
      take: 5,
    }),
  ]);

  const monthRevenue = Number(monthSales._sum.total || 0);
  const monthExpense = Number(monthExpenses._sum.amount || 0);
  const profit = monthRevenue - monthExpense;

  return (
    <div>
      <AdminPageHeader
        eyebrow="Insight"
        title="Laporan Keuangan"
        description="Ringkasan pendapatan, pengeluaran, dan transaksi BagusMusik bulan ini."
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Pendapatan Bulan Ini"
          value={formatIDR(monthRevenue)}
          hint={`${monthSalesCount} transaksi`}
          tone="good"
          icon={<Icon name="wallet" className="h-5 w-5" />}
        />
        <StatCard
          label="Pengeluaran Bulan Ini"
          value={formatIDR(monthExpense)}
          tone="warn"
          icon={<Icon name="receipt" className="h-5 w-5" />}
        />
        <StatCard
          label="Laba / Rugi"
          value={formatIDR(profit)}
          hint={profit >= 0 ? "Laba" : "Rugi"}
          tone={profit >= 0 ? "good" : "bad"}
          icon={<Icon name="chart" className="h-5 w-5" />}
        />
        <StatCard
          label="Pelanggan Total"
          value={String(totalCustomers)}
          hint={`${activeOrders} servis aktif`}
          icon={<Icon name="users" className="h-5 w-5" />}
        />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <section className="panel overflow-hidden lg:col-span-2">
          <div className="flex items-center justify-between border-b border-white/10 px-4 py-3.5 sm:px-5">
            <div>
              <h2 className="font-display text-lg font-bold text-white">
                Transaksi Terbaru
              </h2>
              <p className="text-xs text-slate-500">Riwayat penjualan dan pelunasan</p>
            </div>
            <Link
              href="/admin/pos"
              className="inline-flex items-center gap-1 text-xs font-semibold text-brass-300 hover:text-brass-200"
            >
              Kelola POS
              <Icon name="arrow-right" className="h-3.5 w-3.5" />
            </Link>
          </div>
          {recentSales.length ? (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] text-left text-sm">
                <thead>
                  <tr className="border-b border-white/5 text-[0.65rem] uppercase tracking-wider text-slate-500">
                    <th className="px-4 py-2.5 font-semibold sm:px-5">No. Transaksi</th>
                    <th className="px-3 py-2.5 font-semibold">Pelanggan</th>
                    <th className="px-3 py-2.5 font-semibold">Kasir</th>
                    <th className="px-3 py-2.5 text-right font-semibold">Total</th>
                    <th className="px-3 py-2.5 text-center font-semibold">Status</th>
                    <th className="px-3 py-2.5 font-semibold">Tanggal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {recentSales.map((sale) => (
                    <tr key={sale.id} className="hover:bg-white/[0.03]">
                      <td className="px-4 py-3 sm:px-5 font-mono text-xs text-slate-400">
                        {sale.saleNumber}
                      </td>
                      <td className="px-3 py-3">
                        <span className="text-sm font-medium text-slate-200">
                          {sale.customer?.name || "-"}
                        </span>
                        <p className="text-[0.65rem] text-slate-500">
                          {sale.customer?.whatsapp || "-"}
                        </p>
                      </td>
                      <td className="px-3 py-3 text-slate-400">
                        {sale.cashier?.name || "-"}
                      </td>
                      <td className="px-3 py-3 text-right text-slate-300">
                        {formatIDR(sale.total)}
                      </td>
                      <td className="px-3 py-3 text-center">
                        <span
                          className={cn(
                            "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[0.65rem]",
                            sale.paymentStatus === "PAID"
                              ? "bg-emerald-500/10 text-emerald-300 ring-emerald-500/30"
                              : sale.paymentStatus === "PARTIAL"
                                ? "bg-amber-500/10 text-amber-300 ring-amber-500/30"
                                : "bg-rose-500/10 text-rose-300 ring-rose-500/30",
                          )}
                        >
                          {sale.paymentStatus}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-xs text-slate-500">
                        {formatDate(sale.createdAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-4">
              <div className="rounded-xl border border-dashed border-white/10 bg-white/[0.02] px-6 py-8 text-center">
                <p className="text-sm text-slate-400">Belum ada transaksi tercatat.</p>
              </div>
            </div>
          )}
        </section>

        <section className="panel overflow-hidden">
          <div className="flex items-center justify-between border-b border-white/10 px-4 py-3.5 sm:px-5">
            <div>
              <h2 className="font-display text-lg font-bold text-white">
                Layanan Paling Banyak
              </h2>
              <p className="text-xs text-slate-500">Berdasarkan qty work order item</p>
            </div>
          </div>
          <div className="p-4">
            {topServices.length ? (
              <ul className="divide-y divide-white/5">
                {topServices.map((item, i) => (
                  <li key={i} className="px-4 py-3 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-slate-200">
                        {item.description || "-"}
                      </p>
                      <p className="text-[0.65rem] text-slate-500">
                        Qty: {item._sum.qty}
                      </p>
                    </div>
                    <span className="font-mono text-xs text-brass-400">
                      #{i + 1}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="p-4 text-center text-xs text-slate-500">
                Belum ada data layanan.
              </p>
            )}
          </div>
        </section>
      </div>

      <section className="mt-4 panel overflow-hidden">
        <div className="p-5 sm:p-6">
          <h2 className="font-display text-lg font-bold text-white">
            Ringkasan Bulanan
          </h2>
          <p className="mt-1 text-sm text-slate-400">
            Periode {formatDate(monthStart)} – {formatDate(monthEnd)}
          </p>
          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
              <p className="text-[0.65rem] font-semibold uppercase tracking-wider text-slate-400">
                Pendapatan
              </p>
              <p className="mt-1 font-display text-xl font-bold text-white">
                {formatIDR(monthRevenue)}
              </p>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
              <p className="text-[0.65rem] font-semibold uppercase tracking-wider text-slate-400">
                Pengeluaran
              </p>
              <p className="mt-1 font-display text-xl font-bold text-white">
                {formatIDR(monthExpense)}
              </p>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
              <p className="text-[0.65rem] font-semibold uppercase tracking-wider text-slate-400">
                Laba Bersih
              </p>
              <p className={cn("mt-1 font-display text-xl font-bold", profit >= 0 ? "text-emerald-400" : "text-rose-400")}>
                {formatIDR(profit)}
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
