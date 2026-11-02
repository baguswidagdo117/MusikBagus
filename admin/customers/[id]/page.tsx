import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { requirePermission } from "@/lib/auth";
import { hasPermission } from "@/lib/permissions";
import {
  formatDate,
  formatDateTime,
  formatIDR,
  initials,
  relativeTime,
  toNumber,
} from "@/lib/utils";
import { AdminPageHeader } from "@/components/admin/page-header";
import { CustomerFormDialog } from "@/components/admin/customer-form";
import { EmptyState, StatCard, StatusBadge } from "@/components/ui";
import { Icon } from "@/components/icons";

export const dynamic = "force-dynamic";

function waLink(phone: string) {
  const digits = phone.replace(/\D/g, "");
  return `https://wa.me/${digits.startsWith("0") ? `62${digits.slice(1)}` : digits}`;
}

export default async function CustomerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requirePermission("CUSTOMER_VIEW");
  const { id } = await params;
  const customer = await prisma.customer.findUnique({
    where: { id },
    include: {
      bookings: { orderBy: { createdAt: "desc" }, take: 20 },
      serviceOrders: {
        orderBy: { createdAt: "desc" },
        take: 20,
        include: {
          technician: { include: { user: { select: { name: true } } } },
          invoice: true,
        },
      },
      sales: {
        orderBy: { createdAt: "desc" },
        take: 20,
        include: { invoice: true },
      },
    },
  });
  if (!customer) notFound();

  const totalSpent = customer.sales.reduce(
    (sum, sale) => sum + toNumber(sale.paid),
    0,
  );
  const totalOrders = customer.serviceOrders.length;
  const activeOrders = customer.serviceOrders.filter(
    (order) => !["PAID", "CLOSED", "CANCELLED"].includes(order.status),
  ).length;

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-2 text-xs text-slate-500">
        <Link
          href="/admin/customers"
          className="inline-flex items-center gap-1 font-semibold text-slate-400 hover:text-white"
        >
          <Icon name="arrow-left" className="h-3.5 w-3.5" />
          Pelanggan
        </Link>
        <span>/</span>
        <span className="font-mono text-slate-400">{customer.code}</span>
      </div>

      <AdminPageHeader
        title={customer.name}
        description={`Terdaftar ${formatDate(customer.createdAt)} · ${customer.bookings.length} booking · ${customer.sales.length} transaksi`}
        actions={
          <>
            <a
              href={waLink(customer.whatsapp)}
              target="_blank"
              rel="noreferrer"
              className="btn-white"
            >
              <Icon name="whatsapp" className="h-4 w-4" />
              WhatsApp
            </a>
            {hasPermission(user.role, "CUSTOMER_UPDATE") ? (
              <CustomerFormDialog
                customer={{
                  id: customer.id,
                  name: customer.name,
                  whatsapp: customer.whatsapp,
                  email: customer.email,
                  address: customer.address,
                  notes: customer.notes,
                }}
              />
            ) : null}
          </>
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard
          label="Total Servis"
          value={String(totalOrders)}
          hint={`${activeOrders} sedang berjalan`}
          icon={<Icon name="wrench" className="h-5 w-5" />}
        />
        <StatCard
          label="Total Transaksi"
          value={String(customer.sales.length)}
          icon={<Icon name="receipt" className="h-5 w-5" />}
        />
        <StatCard
          label="Total Belanja"
          value={formatIDR(totalSpent)}
          hint="Akumulasi pembayaran"
          tone="good"
          icon={<Icon name="wallet" className="h-5 w-5" />}
        />
        <StatCard
          label="Booking"
          value={String(customer.bookings.length)}
          hint={
            customer.bookings[0]
              ? `Terakhir ${relativeTime(customer.bookings[0].createdAt)}`
              : "Belum ada"
          }
          icon={<Icon name="calendar" className="h-5 w-5" />}
        />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <section className="panel p-4 sm:p-5">
          <div className="flex items-center gap-3">
            <span className="grid h-14 w-14 place-items-center rounded-full bg-brass-500/15 font-display text-lg font-bold text-brass-200">
              {initials(customer.name)}
            </span>
            <div>
              <p className="font-semibold text-white">{customer.name}</p>
              <p className="font-mono text-xs text-slate-500">
                {customer.code}
              </p>
            </div>
          </div>
          <dl className="mt-4 space-y-3 text-sm">
            <div>
              <dt className="text-[0.65rem] uppercase tracking-wider text-slate-500">
                WhatsApp
              </dt>
              <dd className="mt-0.5 text-slate-200">{customer.whatsapp}</dd>
            </div>
            <div>
              <dt className="text-[0.65rem] uppercase tracking-wider text-slate-500">
                Email
              </dt>
              <dd className="mt-0.5 text-slate-200">
                {customer.email || "-"}
              </dd>
            </div>
            <div>
              <dt className="text-[0.65rem] uppercase tracking-wider text-slate-500">
                Alamat
              </dt>
              <dd className="mt-0.5 whitespace-pre-line text-slate-300">
                {customer.address || "-"}
              </dd>
            </div>
            <div>
              <dt className="text-[0.65rem] uppercase tracking-wider text-slate-500">
                Catatan
              </dt>
              <dd className="mt-0.5 whitespace-pre-line text-slate-300">
                {customer.notes || "-"}
              </dd>
            </div>
          </dl>
        </section>

        <section className="panel overflow-hidden lg:col-span-2">
          <div className="flex items-center justify-between border-b border-white/10 px-4 py-3.5 sm:px-5">
            <div>
              <h2 className="font-display text-base font-bold text-white">
                Riwayat Servis
              </h2>
              <p className="text-xs text-slate-500">
                Work order dan status pengerjaan
              </p>
            </div>
            {hasPermission(user.role, "WORKORDER_CREATE") ? (
              <Link
                href={`/admin/work-orders?new=1`}
                className="text-xs font-semibold text-brass-300 hover:text-brass-200"
              >
                Buat WO
              </Link>
            ) : null}
          </div>
          {customer.serviceOrders.length ? (
            <ul className="divide-y divide-white/5">
              {customer.serviceOrders.map((order) => (
                <li key={order.id}>
                  <Link
                    href={`/admin/work-orders/${order.id}`}
                    className="flex flex-wrap items-center gap-3 px-4 py-3 hover:bg-white/[0.03] sm:px-5"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-xs font-semibold text-brass-300">
                          {order.orderNumber}
                        </span>
                        <StatusBadge status={order.status} kind="order" />
                        {order.invoice ? (
                          <span className="text-[0.6rem] text-emerald-400">
                            {order.invoice.invoiceNumber}
                          </span>
                        ) : null}
                      </div>
                      <p className="mt-1 truncate text-sm text-slate-300">
                        {order.instrumentType}
                        {order.brand ? ` · ${order.brand}` : ""} —{" "}
                        {order.complaint}
                      </p>
                      <p className="text-[0.65rem] text-slate-500">
                        {order.technician?.user.name ?? "Belum ada teknisi"} ·{" "}
                        {relativeTime(order.createdAt)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-slate-200">
                        {formatIDR(order.estimateCost)}
                      </p>
                      <Icon
                        name="chevron-right"
                        className="ml-auto mt-1 h-3.5 w-3.5 text-slate-600"
                      />
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <div className="p-4">
              <EmptyState
                title="Belum ada riwayat servis"
                description="Work order pelanggan ini akan tampil di sini."
              />
            </div>
          )}
        </section>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <section className="panel overflow-hidden">
          <div className="border-b border-white/10 px-4 py-3.5 sm:px-5">
            <h2 className="font-display text-base font-bold text-white">
              Booking
            </h2>
            <p className="text-xs text-slate-500">Permintaan servis pelanggan</p>
          </div>
          {customer.bookings.length ? (
            <ul className="divide-y divide-white/5">
              {customer.bookings.map((booking) => (
                <li key={booking.id}>
                  <Link
                    href={`/admin/bookings/${booking.id}`}
                    className="flex items-center gap-3 px-4 py-3 hover:bg-white/[0.03] sm:px-5"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-[0.7rem] font-semibold text-brass-300">
                          {booking.bookingNumber}
                        </span>
                        <StatusBadge status={booking.status} />
                      </div>
                      <p className="mt-1 truncate text-xs text-slate-400">
                        {booking.instrumentType} · {formatDate(booking.date)}{" "}
                        {booking.time}
                      </p>
                      <p className="line-clamp-1 text-[0.65rem] text-slate-500">
                        {booking.complaint}
                      </p>
                    </div>
                    <Icon
                      name="chevron-right"
                      className="h-4 w-4 text-slate-600"
                    />
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="p-5 text-center text-xs text-slate-500">
              Belum ada booking.
            </p>
          )}
        </section>

        <section className="panel overflow-hidden">
          <div className="border-b border-white/10 px-4 py-3.5 sm:px-5">
            <h2 className="font-display text-base font-bold text-white">
              Transaksi POS
            </h2>
            <p className="text-xs text-slate-500">Pembelian & invoice</p>
          </div>
          {customer.sales.length ? (
            <ul className="divide-y divide-white/5">
              {customer.sales.map((sale) => (
                <li
                  key={sale.id}
                  className="flex items-center gap-3 px-4 py-3 sm:px-5"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[0.7rem] font-semibold text-brass-300">
                        {sale.saleNumber}
                      </span>
                      <StatusBadge
                        status={sale.paymentStatus}
                        className="normal-case tracking-normal"
                      />
                    </div>
                    <p className="mt-0.5 text-[0.65rem] text-slate-500">
                      {formatDateTime(sale.createdAt)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-slate-200">
                      {formatIDR(sale.total)}
                    </p>
                    {sale.invoice ? (
                      <Link
                        href={`/invoice/${sale.invoice.invoiceNumber}`}
                        target="_blank"
                        className="text-[0.65rem] font-medium text-brass-300 hover:text-brass-200"
                      >
                        Invoice
                      </Link>
                    ) : null}
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="p-5 text-center text-xs text-slate-500">
              Belum ada transaksi POS.
            </p>
          )}
        </section>
      </div>
    </div>
  );
}
