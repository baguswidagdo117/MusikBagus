import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import {
  daysAgo,
  endOfDay,
  formatIDR,
  formatLongDate,
  relativeTime,
  startOfDay,
  startOfMonth,
} from "@/lib/utils";
import { ROLE_LABEL } from "@/lib/permissions";
import { AdminPageHeader } from "@/components/admin/page-header";
import { RevenueChart, type RevenuePoint } from "@/components/admin/revenue-chart";
import { StatCard, StatusBadge, EmptyState } from "@/components/ui";
import { Icon } from "@/components/icons";

export const dynamic = "force-dynamic";

const activeStatuses = [
  "RECEIVED",
  "DIAGNOSING",
  "WAITING_APPROVAL",
  "IN_PROGRESS",
  "COMPLETED",
  "READY_FOR_PICKUP",
];

function netPayment(
  payments: { amount: unknown; type: string }[],
): number {
  return payments.reduce(
    (sum, payment) =>
      sum +
      (payment.type === "REFUND"
        ? -Number(payment.amount)
        : Number(payment.amount)),
    0,
  );
}

function greeting() {
  const hour = new Date().getHours();
  if (hour < 11) return "Selamat pagi";
  if (hour < 15) return "Selamat siang";
  if (hour < 19) return "Selamat sore";
  return "Selamat malam";
}

export default async function AdminDashboardPage() {
  const user = await requireAdmin();
  const now = new Date();
  const dayStart = startOfDay(now);
  const dayEnd = endOfDay(now);
  const monthStart = startOfMonth(now);
  const weekStart = startOfDay(daysAgo(6));

  const [
    bookingToday,
    pendingBookings,
    activeOrders,
    completedMonth,
    customerCount,
    salesToday,
    monthPayments,
    monthExpenses,
    weekPayments,
    recentBookings,
    activeOrderList,
    inventoryList,
    notifications,
  ] = await Promise.all([
    prisma.booking.count({
      where: { date: { gte: dayStart, lte: dayEnd } },
    }),
    prisma.booking.count({ where: { status: "MENUNGGU" } }),
    prisma.serviceOrder.count({ where: { status: { in: activeStatuses } } }),
    prisma.serviceOrder.count({
      where: {
        status: { in: ["COMPLETED", "READY_FOR_PICKUP", "PAID", "CLOSED"] },
        updatedAt: { gte: monthStart },
      },
    }),
    prisma.customer.count(),
    prisma.sale.count({
      where: { createdAt: { gte: dayStart, lte: dayEnd } },
    }),
    prisma.payment.findMany({
      where: { paidAt: { gte: monthStart } },
      select: { amount: true, type: true, paidAt: true },
    }),
    prisma.expense.aggregate({
      where: { date: { gte: monthStart } },
      _sum: { amount: true },
    }),
    prisma.payment.findMany({
      where: { paidAt: { gte: weekStart } },
      select: { amount: true, type: true, paidAt: true },
    }),
    prisma.booking.findMany({
      include: { customer: true, service: true },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
    prisma.serviceOrder.findMany({
      where: { status: { in: activeStatuses } },
      include: {
        customer: true,
        technician: { include: { user: true } },
      },
      orderBy: { updatedAt: "desc" },
      take: 5,
    }),
    prisma.inventory.findMany({
      where: { active: true },
      orderBy: { stock: "asc" },
      take: 40,
    }),
    prisma.notification.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
  ]);

  const monthRevenue = netPayment(monthPayments);
  const monthExpense = Number(monthExpenses._sum.amount || 0);
  const todayRevenue = netPayment(
    monthPayments.filter((payment) => payment.paidAt >= dayStart),
  );
  const profit = monthRevenue - monthExpense;
  const lowStock = inventoryList
    .filter((item) => item.stock <= item.minStock)
    .slice(0, 5);

  const chart: RevenuePoint[] = Array.from({ length: 7 }, (_, index) => {
    const date = daysAgo(6 - index);
    const start = startOfDay(date);
    const end = endOfDay(date);
    return {
      label: date.toLocaleDateString("id-ID", { weekday: "short" }),
      value: netPayment(
        weekPayments.filter(
          (payment) => payment.paidAt >= start && payment.paidAt <= end,
        ),
      ),
      highlight: index === 6,
    };
  });
  const weekRevenue = chart.reduce((sum, point) => sum + point.value, 0);
  const isOwner = user.role === "OWNER";

  return (
    <div>
      <AdminPageHeader
        eyebrow={formatLongDate(now)}
        title={`${greeting()}, ${user.name.split(" ")[0]}`}
        description={`Ringkasan operasional BagusMusik hari ini. Anda masuk sebagai ${ROLE_LABEL[user.role]}.`}
        actions={
          <>
            <Link href="/admin/work-orders?new=1" className="btn-white">
              <Icon name="plus" className="h-4 w-4" />
              Work Order
            </Link>
            <Link href="/admin/pos" className="btn-primary">
              <Icon name="receipt" className="h-4 w-4" />
              Buka POS
            </Link>
          </>
        }
      />

      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <StatCard
          label="Booking Hari Ini"
          value={String(bookingToday)}
          hint={`${pendingBookings} menunggu konfirmasi`}
          tone={pendingBookings > 0 ? "warn" : "default"}
          icon={<Icon name="calendar" className="h-5 w-5" />}
        />
        <StatCard
          label="Work Order Aktif"
          value={String(activeOrders)}
          hint={`${completedMonth} selesai bulan ini`}
          tone="default"
          icon={<Icon name="wrench" className="h-5 w-5" />}
        />
        {isOwner ? (
          <StatCard
            label="Pendapatan Hari Ini"
            value={formatIDR(todayRevenue)}
            hint={`${salesToday} transaksi POS`}
            tone="good"
            icon={<Icon name="wallet" className="h-5 w-5" />}
          />
        ) : (
          <StatCard
            label="Pelanggan"
            value={String(customerCount)}
            hint={`${salesToday} transaksi POS hari ini`}
            tone="default"
            icon={<Icon name="users" className="h-5 w-5" />}
          />
        )}
        {isOwner ? (
          <StatCard
            label="Laba Bulan Ini"
            value={formatIDR(profit)}
            hint={`Omzet ${formatIDR(monthRevenue)} · Beban ${formatIDR(monthExpense)}`}
            tone={profit >= 0 ? "good" : "bad"}
            icon={<Icon name="chart" className="h-5 w-5" />}
          />
        ) : (
          <StatCard
            label="Work Order Selesai"
            value={String(completedMonth)}
            hint="Bulan berjalan"
            tone="good"
            icon={<Icon name="check" className="h-5 w-5" />}
          />
        )}
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-3">
        <section className="panel p-4 sm:p-5 xl:col-span-2">
          <div className="mb-5 flex flex-wrap items-start justify-between gap-2">
            <div>
              <h2 className="font-display text-lg font-bold text-white">
                Arus Pendapatan
              </h2>
              <p className="text-xs text-slate-500">
                Total pembayaran bersih setelah refund
              </p>
            </div>
            <div className="text-right">
              <p className="font-display text-xl font-bold text-brass-300">
                {formatIDR(weekRevenue)}
              </p>
              <p className="text-[0.65rem] text-slate-500">7 hari terakhir</p>
            </div>
          </div>
          <RevenueChart data={chart} total={weekRevenue} />
        </section>

        <section id="notifikasi" className="panel p-4 sm:p-5">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-display text-lg font-bold text-white">
              Notifikasi
            </h2>
            <Icon name="bell" className="h-4 w-4 text-slate-500" />
          </div>
          {notifications.length ? (
            <ul className="space-y-1">
              {notifications.map((notification) => {
                const content = (
                  <>
                    <span
                      className={
                        notification.read
                          ? "mt-1.5 h-2 w-2 shrink-0 rounded-full bg-slate-600"
                          : "mt-1.5 h-2 w-2 shrink-0 rounded-full bg-brass-400"
                      }
                    />
                    <span className="min-w-0">
                      <span
                        className={
                          notification.read
                            ? "block truncate text-sm text-slate-300"
                            : "block truncate text-sm font-semibold text-white"
                        }
                      >
                        {notification.title}
                      </span>
                      <span className="mt-0.5 line-clamp-2 block text-xs text-slate-500">
                        {notification.message}
                      </span>
                      <span className="mt-1 block text-[0.65rem] text-slate-600">
                        {relativeTime(notification.createdAt)}
                      </span>
                    </span>
                  </>
                );
                return (
                  <li key={notification.id}>
                    {notification.link ? (
                      <Link
                        href={notification.link}
                        className="flex gap-2.5 rounded-lg p-2 hover:bg-white/5"
                      >
                        {content}
                      </Link>
                    ) : (
                      <div className="flex gap-2.5 p-2">{content}</div>
                    )}
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="rounded-xl border border-dashed border-white/10 p-5 text-center text-xs text-slate-500">
              Belum ada notifikasi. Aktivitas baru akan muncul di sini.
            </p>
          )}
          {pendingBookings > 0 ? (
            <Link
              href="/admin/bookings?status=MENUNGGU"
              className="mt-3 flex items-center justify-between rounded-lg bg-amber-500/10 px-3 py-2 text-xs font-semibold text-amber-300 hover:bg-amber-500/15"
            >
              {pendingBookings} booking menunggu konfirmasi
              <Icon name="arrow-right" className="h-3.5 w-3.5" />
            </Link>
          ) : null}
        </section>
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-3">
        <section className="panel overflow-hidden xl:col-span-2">
          <div className="flex items-center justify-between border-b border-white/10 px-4 py-3.5 sm:px-5">
            <div>
              <h2 className="font-display text-lg font-bold text-white">
                Booking Terbaru
              </h2>
              <p className="text-xs text-slate-500">
                Permintaan servis yang masuk
              </p>
            </div>
            <Link
              href="/admin/bookings"
              className="inline-flex items-center gap-1 text-xs font-semibold text-brass-300 hover:text-brass-200"
            >
              Semua
              <Icon name="arrow-right" className="h-3.5 w-3.5" />
            </Link>
          </div>
          {recentBookings.length ? (
            <ul className="divide-y divide-white/5">
              {recentBookings.map((booking) => (
                <li key={booking.id}>
                  <Link
                    href={`/admin/bookings/${booking.id}`}
                    className="flex flex-wrap items-center gap-3 px-4 py-3 hover:bg-white/[0.03] sm:flex-nowrap sm:px-5"
                  >
                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-white/5 text-slate-400">
                      <Icon name="calendar" className="h-4 w-4" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-2">
                        <span className="truncate text-sm font-semibold text-white">
                          {booking.customer.name}
                        </span>
                        <span className="font-mono text-[0.6rem] text-slate-500">
                          {booking.bookingNumber}
                        </span>
                      </span>
                      <span className="mt-0.5 block truncate text-xs text-slate-500">
                        {booking.instrumentType}
                        {booking.brand ? ` · ${booking.brand}` : ""} —{" "}
                        {booking.complaint}
                      </span>
                    </span>
                    <span className="ml-auto flex shrink-0 flex-col items-end gap-1">
                      <StatusBadge status={booking.status} />
                      <span className="text-[0.65rem] text-slate-600">
                        {relativeTime(booking.createdAt)}
                      </span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <div className="p-4">
              <EmptyState
                title="Belum ada booking"
                description="Booking dari website atau QR toko akan tampil di sini."
              />
            </div>
          )}
        </section>

        <section className="panel overflow-hidden">
          <div className="flex items-center justify-between border-b border-white/10 px-4 py-3.5 sm:px-5">
            <div>
              <h2 className="font-display text-lg font-bold text-white">
                Stok Menipis
              </h2>
              <p className="text-xs text-slate-500">
                {lowStock.length} item perlu restock
              </p>
            </div>
            <Link
              href="/admin/inventory?low=1"
              className="text-xs font-semibold text-brass-300 hover:text-brass-200"
            >
              Kelola
            </Link>
          </div>
          {lowStock.length ? (
            <ul className="divide-y divide-white/5">
              {lowStock.map((item) => {
                const ratio = Math.min(
                  100,
                  Math.round(
                    (item.stock / Math.max(item.minStock, 1)) * 100,
                  ),
                );
                return (
                  <li key={item.id} className="px-4 py-3 sm:px-5">
                    <div className="flex items-center justify-between gap-2">
                      <p className="truncate text-sm font-medium text-slate-200">
                        {item.name}
                      </p>
                      <p className="shrink-0 text-xs font-semibold text-rose-300">
                        {item.stock}/{item.minStock} {item.unit}
                      </p>
                    </div>
                    <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/10">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-rose-500 to-amber-400"
                        style={{ width: `${Math.max(ratio, 4)}%` }}
                      />
                    </div>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="p-5 text-center text-xs text-slate-500">
              Semua stok dalam jumlah aman.
            </p>
          )}
        </section>
      </div>

      <section className="panel mt-4 overflow-hidden">
        <div className="flex items-center justify-between border-b border-white/10 px-4 py-3.5 sm:px-5">
          <div>
            <h2 className="font-display text-lg font-bold text-white">
              Work Order Aktif
            </h2>
            <p className="text-xs text-slate-500">
              Pekerjaan yang sedang berjalan di bengkel
            </p>
          </div>
          <Link
            href="/admin/work-orders"
            className="inline-flex items-center gap-1 text-xs font-semibold text-brass-300 hover:text-brass-200"
          >
            Semua
            <Icon name="arrow-right" className="h-3.5 w-3.5" />
          </Link>
        </div>
        {activeOrderList.length ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead>
                <tr className="border-b border-white/5 text-[0.65rem] uppercase tracking-wider text-slate-500">
                  <th className="px-4 py-2 font-semibold sm:px-5">No. WO</th>
                  <th className="px-3 py-2 font-semibold">Pelanggan</th>
                  <th className="px-3 py-2 font-semibold">Instrumen</th>
                  <th className="px-3 py-2 font-semibold">Teknisi</th>
                  <th className="px-3 py-2 font-semibold">Status</th>
                  <th className="px-4 py-2 text-right font-semibold sm:px-5">
                    Estimasi
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {activeOrderList.map((order) => (
                  <tr
                    key={order.id}
                    className="hover:bg-white/[0.03]"
                  >
                    <td className="px-4 py-3 sm:px-5">
                      <Link
                        href={`/admin/work-orders/${order.id}`}
                        className="font-mono text-xs font-semibold text-brass-300 hover:text-brass-200"
                      >
                        {order.orderNumber}
                      </Link>
                    </td>
                    <td className="px-3 py-3">
                      <p className="font-medium text-slate-200">
                        {order.customer.name}
                      </p>
                      <p className="text-[0.65rem] text-slate-500">
                        {relativeTime(order.updatedAt)}
                      </p>
                    </td>
                    <td className="px-3 py-3 text-slate-400">
                      {order.instrumentType}
                    </td>
                    <td className="px-3 py-3 text-slate-400">
                      {order.technician?.user.name ?? (
                        <span className="text-amber-400/80">Belum ada</span>
                      )}
                    </td>
                    <td className="px-3 py-3">
                      <StatusBadge status={order.status} kind="order" />
                    </td>
                    <td className="px-4 py-3 text-right text-slate-300 sm:px-5">
                      {formatIDR(order.estimateCost)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-4">
            <EmptyState
              title="Tidak ada work order aktif"
              description="Semua pekerjaan sudah selesai atau belum ada order baru."
            />
          </div>
        )}
      </section>
    </div>
  );
}
