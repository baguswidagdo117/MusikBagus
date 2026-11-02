import Link from "next/link";
import { prisma } from "@/lib/db";
import { requirePermission } from "@/lib/auth";
import { cn, formatDate, relativeTime } from "@/lib/utils";
import { AdminPageHeader } from "@/components/admin/page-header";
import { EmptyState, StatusBadge } from "@/components/ui";
import { Icon } from "@/components/icons";

export const dynamic = "force-dynamic";

const TABS = [
  { key: "all", label: "Semua", statuses: null },
  { key: "menunggu", label: "Menunggu", statuses: ["MENUNGGU"] },
  {
    key: "aktif",
    label: "Aktif",
    statuses: [
      "DIKONFIRMASI",
      "MENUNGGU_PEMBAYARAN",
      "DP_DIBAYAR",
      "DIJADWALKAN",
    ],
  },
  {
    key: "dikerjakan",
    label: "Dikerjakan",
    statuses: [
      "ALAT_DITERIMA",
      "DIAGNOSIS",
      "MENUNGGU_PERSETUJUAN",
      "DALAM_PENGERJAAN",
    ],
  },
  {
    key: "selesai",
    label: "Selesai",
    statuses: ["SELESAI", "SIAP_DIAMBIL", "LUNAS"],
  },
  { key: "batal", label: "Dibatalkan", statuses: ["DIBATALKAN"] },
] as const;

const PER_PAGE = 15;

export default async function BookingsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; tab?: string; page?: string }>;
}) {
  await requirePermission("BOOKING_VIEW");
  const { q = "", tab = "all", page: pageParam } = await searchParams;
  const activeTab = TABS.find((item) => item.key === tab) ?? TABS[0];
  const page = Math.max(1, Number(pageParam) || 1);

  const searchWhere = q
    ? {
        OR: [
          { bookingNumber: { contains: q } },
          { customer: { name: { contains: q } } },
          { customer: { whatsapp: { contains: q } } },
          { brand: { contains: q } },
          { complaint: { contains: q } },
        ],
      }
    : {};
  const where = {
    ...searchWhere,
    ...(activeTab.statuses ? { status: { in: [...activeTab.statuses] } } : {}),
  };

  const [items, total, grouped] = await Promise.all([
    prisma.booking.findMany({
      where,
      include: {
        customer: true,
        service: true,
        serviceOrder: {
          select: { id: true, orderNumber: true, status: true },
        },
      },
      orderBy: [{ date: "desc" }, { createdAt: "desc" }],
      skip: (page - 1) * PER_PAGE,
      take: PER_PAGE,
    }),
    prisma.booking.count({ where }),
    prisma.booking.groupBy({ by: ["status"], _count: { _all: true } }),
  ]);

  const counts: Record<string, number> = {};
  for (const group of grouped) {
    counts[group.status] = group._count._all;
  }
  const totalAll = grouped.reduce((sum, group) => sum + group._count._all, 0);
  const tabCount = (statuses: readonly string[] | null) =>
    statuses
      ? statuses.reduce((sum, status) => sum + (counts[status] ?? 0), 0)
      : totalAll;

  const totalPages = Math.max(1, Math.ceil(total / PER_PAGE));
  const hrefFor = (nextPage: number) => {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (activeTab.key !== "all") params.set("tab", activeTab.key);
    if (nextPage > 1) params.set("page", String(nextPage));
    const query = params.toString();
    return `/admin/bookings${query ? `?${query}` : ""}`;
  };

  return (
    <div>
      <AdminPageHeader
        eyebrow="Operasional"
        title="Booking Servis"
        description="Kelola permintaan booking dari website, QR toko, dan walk-in."
        actions={
          <>
            <Link href="/booking" target="_blank" className="btn-white">
              <Icon name="plus" className="h-4 w-4" />
              Booking Baru
            </Link>
            <Link href="/admin/work-orders" className="btn-primary">
              <Icon name="wrench" className="h-4 w-4" />
              Work Order
            </Link>
          </>
        }
      />

      <div className="panel overflow-hidden">
        <div className="border-b border-white/10 p-3 sm:p-4">
          <form
            action="/admin/bookings"
            method="get"
            className="flex flex-col gap-2 sm:flex-row"
          >
            {activeTab.key !== "all" ? (
              <input type="hidden" name="tab" value={activeTab.key} />
            ) : null}
            <div className="relative flex-1">
              <Icon
                name="search"
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500"
              />
              <input
                name="q"
                defaultValue={q}
                placeholder="Cari no. booking, nama, WhatsApp, instrumen..."
                className="input-dark pl-9"
                aria-label="Cari booking"
              />
            </div>
            <button className="btn-white sm:w-auto" type="submit">
              Cari
            </button>
            {q ? (
              <Link
                href={`/admin/bookings?tab=${activeTab.key}`}
                className="btn-ghost-dark"
              >
                Reset
              </Link>
            ) : null}
          </form>

          <div className="scrollbar-none mt-3 flex gap-1.5 overflow-x-auto pb-0.5">
            {TABS.map((item) => {
              const count = tabCount(item.statuses);
              return (
                <Link
                  key={item.key}
                  href={
                    item.key === "all"
                      ? `/admin/bookings${q ? `?q=${encodeURIComponent(q)}` : ""}`
                      : `/admin/bookings?tab=${item.key}${q ? `&q=${encodeURIComponent(q)}` : ""}`
                  }
                  className={cn(
                    "inline-flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors",
                    activeTab.key === item.key
                      ? "bg-brass-500 text-ink-950"
                      : "bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white",
                  )}
                >
                  {item.label}
                  <span
                    className={cn(
                      "rounded px-1 text-[0.6rem]",
                      activeTab.key === item.key
                        ? "bg-ink-950/15 text-ink-950"
                        : "bg-white/10 text-slate-400",
                    )}
                  >
                    {count}
                  </span>
                </Link>
              );
            })}
          </div>
        </div>

        {items.length ? (
          <ul className="divide-y divide-white/5">
            {items.map((booking) => (
              <li key={booking.id}>
                <Link
                  href={`/admin/bookings/${booking.id}`}
                  className="block px-4 py-3.5 transition-colors hover:bg-white/[0.03] sm:px-5"
                >
                  <div className="flex flex-wrap items-start gap-x-4 gap-y-2 sm:flex-nowrap">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-[0.7rem] font-semibold text-brass-300">
                          {booking.bookingNumber}
                        </span>
                        <StatusBadge status={booking.status} />
                        {booking.source ? (
                          <span className="rounded bg-white/5 px-1.5 py-0.5 text-[0.6rem] font-medium uppercase tracking-wide text-slate-500">
                            {booking.source}
                          </span>
                        ) : null}
                        {booking.serviceOrder ? (
                          <span className="inline-flex items-center gap-1 rounded bg-emerald-500/10 px-1.5 py-0.5 text-[0.6rem] font-semibold text-emerald-300">
                            <Icon name="wrench" className="h-3 w-3" />
                            {booking.serviceOrder.orderNumber}
                          </span>
                        ) : null}
                      </div>
                      <p className="mt-1.5 truncate text-sm font-semibold text-white">
                        {booking.customer.name}
                      </p>
                      <p className="truncate text-xs text-slate-500">
                        {booking.customer.whatsapp} · {booking.instrumentType}
                        {booking.brand ? ` ${booking.brand}` : ""}
                        {booking.model ? ` ${booking.model}` : ""}
                      </p>
                      <p className="mt-1 line-clamp-1 text-xs text-slate-400">
                        {booking.complaint}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-4 text-right">
                      <div>
                        <p className="text-xs font-semibold text-slate-300">
                          {formatDate(booking.date)}
                        </p>
                        <p className="text-[0.65rem] text-slate-500">
                          Pukul {booking.time} WIB
                        </p>
                      </div>
                      <div className="hidden w-20 sm:block">
                        <p className="text-[0.65rem] text-slate-500">
                          Masuk
                        </p>
                        <p className="text-xs text-slate-400">
                          {relativeTime(booking.createdAt)}
                        </p>
                      </div>
                      <Icon
                        name="chevron-right"
                        className="h-4 w-4 text-slate-600"
                      />
                    </div>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <div className="p-4">
            <EmptyState
              icon={<Icon name="calendar" className="h-5 w-5" />}
              title="Tidak ada booking"
              description={
                q
                  ? "Tidak ada hasil untuk pencarian tersebut. Coba kata kunci lain."
                  : "Booking baru akan muncul di sini secara otomatis."
              }
              action={
                q ? (
                  <Link href="/admin/bookings" className="btn-white">
                    Reset Pencarian
                  </Link>
                ) : (
                  <Link href="/booking" className="btn-white">
                    Buat Booking
                  </Link>
                )
              }
            />
          </div>
        )}

        {total > 0 ? (
          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-white/10 px-4 py-3 text-xs text-slate-500 sm:px-5">
            <p>
              Menampilkan {(page - 1) * PER_PAGE + 1}–
              {Math.min(page * PER_PAGE, total)} dari {total} booking
            </p>
            <div className="flex items-center gap-1">
              <Link
                href={hrefFor(Math.max(1, page - 1))}
                aria-disabled={page <= 1}
                className={cn(
                  "btn-ghost-dark h-8 px-2.5 text-xs",
                  page <= 1 && "pointer-events-none opacity-40",
                )}
              >
                <Icon name="chevron-left" className="h-3.5 w-3.5" />
                Prev
              </Link>
              <span className="px-2 text-slate-400">
                {page}/{totalPages}
              </span>
              <Link
                href={hrefFor(Math.min(totalPages, page + 1))}
                aria-disabled={page >= totalPages}
                className={cn(
                  "btn-ghost-dark h-8 px-2.5 text-xs",
                  page >= totalPages && "pointer-events-none opacity-40",
                )}
              >
                Next
                <Icon name="chevron-right" className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
