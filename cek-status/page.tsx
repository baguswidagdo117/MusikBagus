import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { getSettings } from "@/lib/settings";
import {
  formatDate,
  formatDateTime,
  formatIDR,
  formatLongDate,
} from "@/lib/utils";
import { timelineForStatus, statusLabel } from "@/lib/status";
import { PublicHeader } from "@/components/public-header";
import { PublicFooter } from "@/components/public-footer";
import { Icon } from "@/components/icons";
import { StatusBadge, PublicBadge } from "@/components/ui";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Cek Status Servis",
  description:
    "Pantau status perbaikan alat musik Anda menggunakan nomor booking atau nomor service order.",
};

export default async function StatusPage({
  searchParams,
}: {
  searchParams: Promise<{ no?: string }>;
}) {
  const { no } = await searchParams;
  const settings = await getSettings();
  const query = no?.trim().toUpperCase() ?? "";

  const booking = query
    ? await prisma.booking.findFirst({
        where: { bookingNumber: query },
        include: {
          customer: true,
          service: true,
          serviceOrder: {
            include: {
              items: true,
              technician: { include: { user: { select: { name: true } } } },
              invoice: true,
            },
          },
        },
      })
    : null;

  const orderOnly =
    !booking && query
      ? await prisma.serviceOrder.findFirst({
          where: { orderNumber: query },
          include: {
            customer: true,
            items: true,
            technician: { include: { user: { select: { name: true } } } },
            invoice: true,
            booking: true,
          },
        })
      : null;

  const found = booking || orderOnly;
  const order = booking?.serviceOrder ?? orderOnly ?? null;
  const status = order?.status ?? booking?.status ?? "";
  const kind: "booking" | "order" = order ? "order" : "booking";
  const timeline = found ? timelineForStatus(kind, status) : [];
  const isCancelled = status === "DIBATALKAN" || status === "CANCELLED";

  const instrument = order ?? booking;
  const customer = booking?.customer ?? orderOnly?.customer ?? null;
  const displayNumber = booking?.bookingNumber ?? orderOnly?.orderNumber ?? query;
  const firstItem = order?.items.find((i) => i.type === "JASA");
  const serviceName =
    firstItem?.description ?? booking?.service?.name ?? "Pemeriksaan servis";
  const total =
    order?.items.reduce((sum, item) => sum + Number(item.subtotal), 0) ??
    (booking?.service ? Number(booking.service.price) : 0);

  const waNumber = settings.whatsapp.replace(/^0/, "62").replace(/\D/g, "");
  const waMessage = encodeURIComponent(
    `Halo BagusMusik, saya ingin menanyakan status servis ${displayNumber} (${instrument?.instrumentType ?? ""} ${instrument?.brand ?? ""}). Terima kasih.`,
  );

  return (
    <div className="min-h-dvh">
      <PublicHeader />
      <main>
        <section className="border-b border-ink-900/10">
          <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 sm:py-14">
            <PublicBadge>Cek Status</PublicBadge>
            <h1 className="mt-4 font-display text-4xl font-bold tracking-tight text-ink-950 sm:text-5xl">
              Pantau perjalanan alat Anda
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-ink-600 sm:text-base">
              Masukkan nomor booking (BK-xxxx) atau nomor service order
              (SO-xxxx) yang tertera pada nota.
            </p>

            <form
              action="/cek-status"
              method="GET"
              className="mt-6 flex flex-col gap-2 rounded-2xl border border-ink-900/10 bg-white p-3 shadow-sm sm:flex-row"
            >
              <div className="relative flex-1">
                <Icon
                  name="search"
                  className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-500"
                />
                <input
                  name="no"
                  defaultValue={query}
                  className="input border-0 bg-transparent pl-10 focus:ring-0"
                  placeholder="Contoh: SO-2026-00001"
                  autoCapitalize="characters"
                  autoComplete="off"
                  spellCheck={false}
                  aria-label="Nomor servis"
                />
              </div>
              <button type="submit" className="btn-primary sm:w-auto">
                Cek Status
                <Icon name="arrow-right" className="h-4 w-4" />
              </button>
            </form>
            <p className="mt-2 text-xs text-ink-500">
              QR pada nota dapat membuka halaman ini dengan nomor terisi otomatis.
            </p>
          </div>
        </section>

        <section className="mx-auto max-w-4xl px-4 py-8 sm:px-6 sm:py-12">
          {!query ? (
            <div className="grid gap-4 sm:grid-cols-3">
              {[
                {
                  icon: "receipt" as const,
                  title: "Temukan nomor",
                  desc: "Nomor booking ada di halaman sukses booking. Nomor servis ada di nota.",
                },
                {
                  icon: "activity" as const,
                  title: "Lihat progres",
                  desc: "Timeline menunjukkan tahap servis, dari alat diterima hingga siap diambil.",
                },
                {
                  icon: "whatsapp" as const,
                  title: "Tanya langsung",
                  desc: "Butuh penjelasan? Hubungi kami via WhatsApp dengan menyertakan nomor servis.",
                },
              ].map((item) => (
                <div
                  key={item.title}
                  className="rounded-2xl border border-ink-900/10 bg-white p-5"
                >
                  <span className="grid h-10 w-10 place-items-center rounded-xl bg-[#f3ecdf] text-brass-700">
                    <Icon name={item.icon} className="h-5 w-5" />
                  </span>
                  <p className="mt-3 font-semibold text-ink-900">{item.title}</p>
                  <p className="mt-1 text-sm leading-relaxed text-ink-600">
                    {item.desc}
                  </p>
                </div>
              ))}
            </div>
          ) : !found ? (
            <div className="rounded-3xl border border-rose-200 bg-white p-8 text-center shadow-sm">
              <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-rose-50 text-rose-600">
                <Icon name="alert" className="h-7 w-7" />
              </span>
              <h2 className="mt-4 font-display text-2xl font-bold text-ink-950">
                Nomor tidak ditemukan
              </h2>
              <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-ink-600">
                Periksa kembali nomor <strong>{query}</strong>. Pastikan formatnya
                benar, misalnya <span className="font-mono">SO-2026-00001</span>{" "}
                atau <span className="font-mono">BK-2026-00001</span>.
              </p>
              <div className="mt-6 flex flex-col justify-center gap-2 sm:flex-row">
                <a
                  href={`https://wa.me/${waNumber}?text=${encodeURIComponent(`Halo BagusMusik, saya ingin menanyakan nomor servis ${query}.`)}`}
                  target="_blank"
                  rel="noreferrer"
                  className="btn-primary"
                >
                  <Icon name="whatsapp" className="h-4 w-4" />
                  Tanya via WhatsApp
                </a>
                <Link href="/cek-status" className="btn-outline">
                  Coba nomor lain
                </Link>
              </div>
            </div>
          ) : (
            <div className="animate-fade-up space-y-4">
              <div className="overflow-hidden rounded-3xl border border-ink-900/10 bg-white shadow-sm">
                <div className="border-b border-ink-900/10 bg-[#faf7f1] px-5 py-5 sm:px-7">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-[0.65rem] font-bold uppercase tracking-[0.18em] text-ink-500">
                        {order ? "Service Order" : "Booking"}
                      </p>
                      <p className="mt-1 font-mono text-xl font-bold text-ink-950 sm:text-2xl">
                        {displayNumber}
                      </p>
                      <p className="mt-1 text-sm text-ink-600">
                        {instrument?.instrumentType} {instrument?.brand}{" "}
                        {instrument?.model}
                      </p>
                    </div>
                    <StatusBadge status={status} kind={kind} />
                  </div>
                </div>

                <div className="grid gap-6 p-5 sm:p-7 md:grid-cols-[1fr_240px]">
                  <div>
                    {isCancelled ? (
                      <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
                        <p className="font-semibold">Servis dibatalkan</p>
                        <p className="mt-1 text-xs leading-relaxed">
                          Silakan hubungi kami jika membutuhkan penjelasan atau
                          ingin menjadwalkan ulang.
                        </p>
                      </div>
                    ) : (
                      <ol className="relative">
                        {timeline.map((item, i) => (
                          <li key={item.key} className="relative flex gap-4 pb-6 last:pb-0">
                            {i < timeline.length - 1 ? (
                              <span
                                className={cn(
                                  "absolute left-[13px] top-7 h-[calc(100%-1rem)] w-px",
                                  item.done ? "bg-emerald-400" : "bg-ink-900/10",
                                )}
                              />
                            ) : null}
                            <span
                              className={cn(
                                "relative z-10 grid h-7 w-7 shrink-0 place-items-center rounded-full text-[0.65rem] font-bold",
                                item.done &&
                                  "bg-emerald-100 text-emerald-700 ring-1 ring-emerald-300",
                                item.active &&
                                  "bg-brass-500 text-ink-950 ring-4 ring-brass-500/20",
                                !item.done &&
                                  !item.active &&
                                  "border border-ink-900/10 bg-white text-ink-400",
                              )}
                            >
                              {item.done ? (
                                <Icon name="check" className="h-3.5 w-3.5" />
                              ) : (
                                i + 1
                              )}
                            </span>
                            <div className="pt-0.5">
                              <p
                                className={cn(
                                  "text-sm font-semibold",
                                  item.active
                                    ? "text-ink-950"
                                    : item.done
                                      ? "text-ink-800"
                                      : "text-ink-400",
                                )}
                              >
                                {item.label}
                              </p>
                              {item.active ? (
                                <p className="mt-0.5 text-xs text-brass-700">
                                  Tahap saat ini
                                </p>
                              ) : null}
                            </div>
                          </li>
                        ))}
                      </ol>
                    )}
                  </div>

                  <div className="space-y-3">
                    <div className="rounded-xl border border-ink-900/10 bg-[#faf7f1] p-3.5">
                      <p className="text-[0.65rem] uppercase tracking-wider text-ink-500">
                        Layanan
                      </p>
                      <p className="mt-0.5 text-sm font-semibold text-ink-900">
                        {serviceName}
                      </p>
                    </div>
                    <div className="rounded-xl border border-ink-900/10 p-3.5">
                      <p className="text-[0.65rem] uppercase tracking-wider text-ink-500">
                        {order?.status === "COMPLETED" ||
                        order?.status === "READY_FOR_PICKUP" ||
                        order?.status === "PAID"
                          ? "Total biaya"
                          : "Estimasi biaya"}
                      </p>
                      <p className="mt-0.5 font-display text-lg font-bold text-ink-950">
                        {total > 0 ? formatIDR(total) : "Menunggu diagnosis"}
                      </p>
                    </div>
                    {order?.estimatedDone ? (
                      <div className="rounded-xl border border-ink-900/10 p-3.5">
                        <p className="text-[0.65rem] uppercase tracking-wider text-ink-500">
                          Estimasi selesai
                        </p>
                        <p className="mt-0.5 text-sm font-semibold text-ink-900">
                          {formatDate(order.estimatedDone)}
                        </p>
                      </div>
                    ) : null}
                    <div className="rounded-xl border border-ink-900/10 p-3.5">
                      <p className="text-[0.65rem] uppercase tracking-wider text-ink-500">
                        Pelanggan
                      </p>
                      <p className="mt-0.5 text-sm font-semibold text-ink-900">
                        {customer?.name.split(" ")[0]} · {customer?.code}
                      </p>
                    </div>
                    {order?.invoice ? (
                      <Link
                        href={`/invoice/${order.invoice.invoiceNumber}`}
                        className="flex items-center justify-between rounded-xl bg-ink-900 p-3.5 text-white"
                      >
                        <div>
                          <p className="text-[0.65rem] uppercase tracking-wider text-slate-400">
                            Invoice
                          </p>
                          <p className="mt-0.5 font-mono text-sm font-semibold">
                            {order.invoice.invoiceNumber}
                          </p>
                        </div>
                        <Icon name="file" className="h-5 w-5 text-brass-300" />
                      </Link>
                    ) : null}
                  </div>
                </div>

                <div className="flex flex-col gap-2 border-t border-ink-900/10 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-7">
                  <p className="text-xs text-ink-500">
                    Terakhir diperbarui{" "}
                    {formatDateTime(order?.updatedAt ?? booking?.updatedAt)}
                  </p>
                  <a
                    href={`https://wa.me/${waNumber}?text=${waMessage}`}
                    target="_blank"
                    rel="noreferrer"
                    className="btn-dark btn-sm"
                  >
                    <Icon name="whatsapp" className="h-4 w-4" />
                    Hubungi via WhatsApp
                  </a>
                </div>
              </div>

              <div className="rounded-2xl border border-ink-900/10 bg-white/60 p-4 text-xs leading-relaxed text-ink-600">
                <div className="flex gap-2">
                  <Icon name="shield" className="mt-0.5 h-4 w-4 shrink-0 text-brass-700" />
                  <div>
                    <p className="font-semibold text-ink-800">
                      Detail keluhan & catatan teknisi
                    </p>
                    <p className="mt-1">
                      {instrument?.complaint}
                    </p>
                    {order?.technicianNotes ? (
                      <p className="mt-2 text-ink-700">
                        Catatan teknisi: {order.technicianNotes}
                      </p>
                    ) : null}
                    <p className="mt-2 text-[0.7rem] text-ink-500">
                      Demi privasi, halaman ini hanya menampilkan sebagian data
                      pelanggan. Hubungi kami untuk detail lengkap.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3 text-sm">
                <Link href="/booking" className="btn-outline">
                  <Icon name="calendar" className="h-4 w-4" />
                  Booking servis lain
                </Link>
                <Link href="/cek-status" className="btn-ghost text-ink-600">
                  Cek nomor lain
                </Link>
              </div>
            </div>
          )}
        </section>
      </main>
      <PublicFooter settings={settings} />
    </div>
  );
}
