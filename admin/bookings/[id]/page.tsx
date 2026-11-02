import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { requirePermission } from "@/lib/auth";
import { hasPermission } from "@/lib/permissions";
import {
  endOfDay,
  formatDate,
  formatDateTime,
  formatIDR,
  relativeTime,
} from "@/lib/utils";
import { getSettings, expectedDp } from "@/lib/settings";
import {
  BOOKING_STATUS_LABEL,
  PAYMENT_METHOD_LABEL,
  timelineForStatus,
} from "@/lib/status";
import { cn, toNumber } from "@/lib/utils";
import { StatusBadge } from "@/components/ui";
import { Icon } from "@/components/icons";
import { BookingActions } from "@/components/admin/booking-actions";

export const dynamic = "force-dynamic";

function waLink(phone: string) {
  const digits = phone.replace(/\D/g, "");
  return `https://wa.me/${digits.startsWith("0") ? `62${digits.slice(1)}` : digits}`;
}

export default async function BookingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requirePermission("BOOKING_VIEW");
  const { id } = await params;
  const [booking, settings] = await Promise.all([
    prisma.booking.findUnique({
      where: { id },
      include: {
        customer: true,
        service: true,
        payments: {
          include: { cashier: { select: { name: true } } },
          orderBy: { paidAt: "desc" },
        },
        serviceOrder: {
          include: {
            technician: { include: { user: true } },
            invoice: true,
            _count: { select: { items: true } },
          },
        },
      },
    }),
    getSettings(),
  ]);

  if (!booking) notFound();

  const canUpdate = hasPermission(user.role, "BOOKING_UPDATE");
  const canCreateOrder = hasPermission(user.role, "WORKORDER_CREATE");
  const timeline = timelineForStatus("booking", booking.status);
  const isCancelled = booking.status === "DIBATALKAN";
  const paymentsTotal = booking.payments.reduce(
    (sum, payment) =>
      sum +
      (payment.type === "REFUND"
        ? -toNumber(payment.amount)
        : toNumber(payment.amount)),
    0,
  );
  const estimate = toNumber(booking.service?.price ?? 0);
  const dp = expectedDp(settings, estimate);
  const today = endOfDay(booking.date);

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-2 text-xs text-slate-500">
        <Link
          href="/admin/bookings"
          className="inline-flex items-center gap-1 font-semibold text-slate-400 hover:text-white"
        >
          <Icon name="arrow-left" className="h-3.5 w-3.5" />
          Booking
        </Link>
        <span>/</span>
        <span className="font-mono text-slate-400">{booking.bookingNumber}</span>
      </div>

      <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="font-display text-2xl font-bold text-white sm:text-3xl">
              {booking.bookingNumber}
            </h1>
            <StatusBadge status={booking.status} />
          </div>
          <p className="mt-1 text-sm text-slate-400">
            Dibuat {formatDateTime(booking.createdAt)} · Sumber{" "}
            {booking.source || "web"}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <a
            href={waLink(booking.customer.whatsapp)}
            target="_blank"
            rel="noreferrer"
            className="btn-white"
          >
            <Icon name="whatsapp" className="h-4 w-4" />
            WhatsApp
          </a>
          <Link
            href={`/cek-status?no=${booking.bookingNumber}`}
            target="_blank"
            className="btn-ghost"
          >
            <Icon name="external" className="h-4 w-4" />
            Halaman Pelanggan
          </Link>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <section className="panel p-4 sm:p-5">
            <div className="flex items-center justify-between gap-2">
              <h2 className="font-display text-base font-bold text-white">
                Pelanggan
              </h2>
              <Link
                href={`/admin/customers/${booking.customerId}`}
                className="text-xs font-semibold text-brass-300 hover:text-brass-200"
              >
                Lihat Profil
              </Link>
            </div>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <div>
                <p className="text-[0.65rem] uppercase tracking-wider text-slate-500">
                  Nama
                </p>
                <p className="mt-0.5 text-sm font-semibold text-white">
                  {booking.customer.name}
                </p>
              </div>
              <div>
                <p className="text-[0.65rem] uppercase tracking-wider text-slate-500">
                  WhatsApp
                </p>
                <p className="mt-0.5 text-sm text-slate-300">
                  {booking.customer.whatsapp}
                </p>
              </div>
              {booking.customer.email ? (
                <div>
                  <p className="text-[0.65rem] uppercase tracking-wider text-slate-500">
                    Email
                  </p>
                  <p className="mt-0.5 text-sm text-slate-300">
                    {booking.customer.email}
                  </p>
                </div>
              ) : null}
              {booking.customer.address ? (
                <div>
                  <p className="text-[0.65rem] uppercase tracking-wider text-slate-500">
                    Alamat
                  </p>
                  <p className="mt-0.5 text-sm text-slate-300">
                    {booking.customer.address}
                  </p>
                </div>
              ) : null}
            </div>
          </section>

          <section className="panel p-4 sm:p-5">
            <h2 className="font-display text-base font-bold text-white">
              Detail Servis
            </h2>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <div>
                <p className="text-[0.65rem] uppercase tracking-wider text-slate-500">
                  Instrumen
                </p>
                <p className="mt-0.5 text-sm font-medium text-white">
                  {booking.instrumentType}
                  {booking.brand ? ` · ${booking.brand}` : ""}
                  {booking.model ? ` ${booking.model}` : ""}
                </p>
              </div>
              <div>
                <p className="text-[0.65rem] uppercase tracking-wider text-slate-500">
                  Nomor seri
                </p>
                <p className="mt-0.5 font-mono text-sm text-slate-300">
                  {booking.serialNumber || "-"}
                </p>
              </div>
              <div>
                <p className="text-[0.65rem] uppercase tracking-wider text-slate-500">
                  Jadwal
                </p>
                <p className="mt-0.5 text-sm text-slate-300">
                  {formatDate(booking.date)} · {booking.time} WIB
                </p>
              </div>
              <div>
                <p className="text-[0.65rem] uppercase tracking-wider text-slate-500">
                  Layanan
                </p>
                <p className="mt-0.5 text-sm text-slate-300">
                  {booking.service?.name || "Belum dipilih"}
                  {estimate > 0 ? (
                    <span className="text-slate-500">
                      {" "}
                      · {formatIDR(estimate)}
                    </span>
                  ) : null}
                </p>
              </div>
            </div>
            <div className="mt-4 rounded-xl bg-white/[0.03] p-3">
              <p className="text-[0.65rem] uppercase tracking-wider text-slate-500">
                Keluhan
              </p>
              <p className="mt-1 whitespace-pre-line text-sm leading-relaxed text-slate-200">
                {booking.complaint}
              </p>
            </div>
            {booking.notes ? (
              <div className="mt-3 rounded-xl bg-white/[0.03] p-3">
                <p className="text-[0.65rem] uppercase tracking-wider text-slate-500">
                  Catatan tambahan
                </p>
                <p className="mt-1 whitespace-pre-line text-sm text-slate-300">
                  {booking.notes}
                </p>
              </div>
            ) : null}
            {booking.photoUrl ? (
              <div className="mt-4">
                <p className="mb-2 text-[0.65rem] uppercase tracking-wider text-slate-500">
                  Foto kondisi alat
                </p>
                <a
                  href={booking.photoUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-block overflow-hidden rounded-xl border border-white/10"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={booking.photoUrl}
                    alt={`Foto ${booking.instrumentType}`}
                    className="max-h-64 w-auto object-cover"
                  />
                </a>
              </div>
            ) : null}
          </section>

          <section className="panel p-4 sm:p-5">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-base font-bold text-white">
                Perjalanan Booking
              </h2>
              {isCancelled ? (
                <span className="badge bg-rose-500/10 text-rose-300 ring-rose-500/30">
                  Dibatalkan
                </span>
              ) : null}
            </div>
            {isCancelled ? (
              <p className="mt-3 rounded-xl border border-rose-500/20 bg-rose-500/5 p-3 text-sm text-rose-200">
                Booking ini dibatalkan. Tidak ada pekerjaan lanjutan yang
                dijadwalkan.
              </p>
            ) : (
              <ol className="mt-4 space-y-0">
                {timeline.map((step, index) => (
                  <li key={step.key} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <span
                        className={cn(
                          "grid h-6 w-6 place-items-center rounded-full border text-[0.6rem] font-bold",
                          step.done &&
                            "border-emerald-500/40 bg-emerald-500/15 text-emerald-300",
                          step.active &&
                            "border-brass-400 bg-brass-500/20 text-brass-200",
                          !step.done &&
                            !step.active &&
                            "border-white/10 bg-white/5 text-slate-600",
                        )}
                      >
                        {step.done ? (
                          <Icon name="check" className="h-3 w-3" />
                        ) : (
                          index + 1
                        )}
                      </span>
                      {index < timeline.length - 1 ? (
                        <span
                          className={cn(
                            "my-0.5 w-px flex-1",
                            step.done ? "bg-emerald-500/30" : "bg-white/10",
                          )}
                          style={{ minHeight: 18 }}
                        />
                      ) : null}
                    </div>
                    <div className="pb-3">
                      <p
                        className={cn(
                          "text-sm",
                          step.active
                            ? "font-semibold text-white"
                            : step.done
                              ? "text-slate-300"
                              : "text-slate-500",
                        )}
                      >
                        {step.label}
                      </p>
                      {step.active ? (
                        <p className="text-[0.65rem] text-brass-400">
                          Tahap saat ini
                        </p>
                      ) : null}
                    </div>
                  </li>
                ))}
              </ol>
            )}
          </section>
        </div>

        <div className="space-y-4">
          <BookingActions
            bookingId={booking.id}
            status={booking.status}
            serviceOrderId={booking.serviceOrder?.id ?? null}
            canUpdate={canUpdate}
            canCreateOrder={canCreateOrder}
          />

          {booking.serviceOrder ? (
            <section className="panel p-4 sm:p-5">
              <h2 className="font-display text-base font-bold text-white">
                Work Order
              </h2>
              <Link
                href={`/admin/work-orders/${booking.serviceOrder.id}`}
                className="mt-3 block rounded-xl bg-white/[0.03] p-3 hover:bg-white/[0.06]"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono text-xs font-semibold text-brass-300">
                    {booking.serviceOrder.orderNumber}
                  </span>
                  <StatusBadge
                    status={booking.serviceOrder.status}
                    kind="order"
                  />
                </div>
                <p className="mt-2 text-xs text-slate-400">
                  Teknisi:{" "}
                  {booking.serviceOrder.technician?.user.name ??
                    "Belum ditugaskan"}
                </p>
                <p className="text-xs text-slate-500">
                  {booking.serviceOrder._count.items} item pekerjaan · Estimasi{" "}
                  {formatIDR(booking.serviceOrder.estimateCost)}
                </p>
                {booking.serviceOrder.invoice ? (
                  <p className="mt-1 text-xs text-emerald-300">
                    Invoice {booking.serviceOrder.invoice.invoiceNumber} ·{" "}
                    {formatIDR(booking.serviceOrder.invoice.total)}
                  </p>
                ) : null}
              </Link>
            </section>
          ) : null}

          <section className="panel p-4 sm:p-5">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-base font-bold text-white">
                Pembayaran
              </h2>
              <Icon name="wallet" className="h-4 w-4 text-slate-500" />
            </div>
            <div className="mt-3 flex items-center justify-between rounded-xl bg-white/[0.03] px-3 py-2.5">
              <div>
                <p className="text-[0.65rem] uppercase tracking-wider text-slate-500">
                  Terbayar
                </p>
                <p className="font-display text-lg font-bold text-white">
                  {formatIDR(paymentsTotal)}
                </p>
              </div>
              <div className="text-right">
                <p className="text-[0.65rem] uppercase tracking-wider text-slate-500">
                  Saran DP
                </p>
                <p className="text-sm font-semibold text-slate-300">
                  {dp > 0 ? formatIDR(dp) : "-"}
                </p>
              </div>
            </div>
            {booking.payments.length ? (
              <ul className="mt-3 space-y-2">
                {booking.payments.map((payment) => (
                  <li
                    key={payment.id}
                    className="flex items-center justify-between gap-2 text-xs"
                  >
                    <div>
                      <p className="font-medium text-slate-200">
                        {PAYMENT_METHOD_LABEL[payment.method] ??
                          payment.method}
                        {payment.type === "REFUND" ? " (refund)" : ""}
                      </p>
                      <p className="text-[0.65rem] text-slate-500">
                        {formatDateTime(payment.paidAt)}
                        {payment.cashier
                          ? ` · ${payment.cashier.name}`
                          : ""}
                      </p>
                    </div>
                    <span className="font-semibold text-slate-200">
                      {formatIDR(payment.amount)}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-3 rounded-lg border border-dashed border-white/10 p-3 text-center text-xs text-slate-500">
                Belum ada pembayaran DP.
              </p>
            )}
            <p className="mt-3 text-[0.65rem] leading-relaxed text-slate-600">
              Pembayaran dicatat melalui POS atau halaman Work Order.
            </p>
          </section>

          <section className="panel p-4 text-xs text-slate-500 sm:p-5">
            <h2 className="font-display text-base font-bold text-white">
              Riwayat
            </h2>
            <dl className="mt-3 space-y-1.5">
              <div className="flex justify-between gap-3">
                <dt>Dibuat</dt>
                <dd className="text-slate-400">
                  {formatDateTime(booking.createdAt)}
                </dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt>Terakhir diubah</dt>
                <dd className="text-slate-400">
                  {relativeTime(booking.updatedAt)}
                </dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt>Sumber</dt>
                <dd className="text-slate-400">{booking.source || "web"}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt>Jadwal</dt>
                <dd className="text-slate-400">
                  {today < new Date() ? "Sudah lewat" : "Akan datang"}
                </dd>
              </div>
            </dl>
            <p className="mt-3 border-t border-white/10 pt-3">
              Status internal: {BOOKING_STATUS_LABEL[booking.status]}
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
