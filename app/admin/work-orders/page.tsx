import Link from "next/link";
import { prisma } from "@/lib/db";
import { requirePermission } from "@/lib/auth";
import { hasPermission } from "@/lib/permissions";
import { cn, formatIDR, relativeTime } from "@/lib/utils";
import { AdminPageHeader } from "@/components/admin/page-header";
import { NewWorkOrderButton } from "@/components/admin/new-work-order";
import { EmptyState, StatusBadge } from "@/components/ui";
import { Icon } from "@/components/icons";

export const dynamic = "force-dynamic";

const TABS = [
  { key: "all", label: "Semua", statuses: null },
  {
    key: "active",
    label: "Dikerjakan",
    statuses: ["RECEIVED", "DIAGNOSING", "WAITING_APPROVAL", "IN_PROGRESS"],
  },
  {
    key: "ready",
    label: "Siap Diambil",
    statuses: ["COMPLETED", "READY_FOR_PICKUP"],
  },
  { key: "done", label: "Selesai", statuses: ["PAID", "CLOSED"] },
  { key: "cancelled", label: "Batal", statuses: ["CANCELLED"] },
] as const;

const PER_PAGE = 15;

export default async function WorkOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    tab?: string;
    page?: string;
    new?: string;
    bookingId?: string;
  }>;
}) {
  const user = await requirePermission("WORKORDER_VIEW");
  const {
    q = "",
    tab = "all",
    page: pageParam,
    new: openNew,
    bookingId,
  } = await searchParams;
  const activeTab = TABS.find((item) => item.key === tab) ?? TABS[0];
  const page = Math.max(1, Number(pageParam) || 1);

  const booking = bookingId
    ? await prisma.booking.findUnique({
        where: { id: bookingId },
        include: { customer: true },
      })
    : null;

  const where = {
    ...(activeTab.statuses ? { status: { in: [...activeTab.statuses] } } : {}),
    ...(q
      ? {
          OR: [
            { orderNumber: { contains: q } },
            { customer: { name: { contains: q } } },
            { customer: { whatsapp: { contains: q } } },
            { brand: { contains: q } },
            { complaint: { contains: q } },
          ],
        }
      : {}),
  };

  const [items, total, grouped, customers, technicianRows] = await Promise.all([
    prisma.serviceOrder.findMany({
      where,
      include: {
        customer: true,
        technician: { include: { user: { select: { name: true } } } },
        booking: { select: { bookingNumber: true } },
        invoice: { select: { invoiceNumber: true, status: true } },
        _count: { select: { items: true } },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PER_PAGE,
      take: PER_PAGE,
    }),
    prisma.serviceOrder.count({ where }),
    prisma.serviceOrder.groupBy({ by: ["status"], _count: { _all: true } }),
    prisma.customer.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true, whatsapp: true },
      take: 300,
    }),
    prisma.technician.findMany({
      where: { active: true },
      include: { user: { select: { name: true } } },
      orderBy: { createdAt: "asc" },
    }),
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

  const technicians = technicianRows.map((technician) => ({
    id: technician.id,
    name: technician.user.name,
    specialization: technician.specialization,
  }));

  const totalPages = Math.max(1, Math.ceil(total / PER_PAGE));
  const hrefFor = (nextPage: number) => {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (activeTab.key !== "all") params.set("tab", activeTab.key);
    if (nextPage > 1) params.set("page", String(nextPage));
    const query = params.toString();
    return `/admin/work-orders${query ? `?${query}` : ""}`;
  };

  const initialBooking =
    booking && openNew === "1"
      ? {
          id: booking.id,
          bookingNumber: booking.bookingNumber,
          customerId: booking.customerId,
          customerName: booking.customer.name,
          instrumentType: booking.instrumentType,
          brand: booking.brand,
          model: booking.model,
          serialNumber: booking.serialNumber,
          complaint: booking.complaint,
        }
      : null;

  return (
    <div>
      <AdminPageHeader
        eyebrow="Operasional"
        title="Work Order"
        description="Pantau pengerjaan servis, penugasan teknisi, dan status pengambilan."
        actions={
          hasPermission(user.role, "WORKORDER_CREATE") ? (
            <NewWorkOrderButton
              customers={customers}
              technicians={technicians}
              booking={initialBooking}
              openOnLoad={openNew === "1"}
            />
          ) : null
        }
      />

      <div className="panel overflow-hidden">
        <div className="border-b border-white/10 p-3 sm:p-4">
          <form
            action="/admin/work-orders"
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
                placeholder="Cari nomor WO, pelanggan, keluhan..."
                className="input-dark pl-9"
                aria-label="Cari work order"
              />
            </div>
            <button className="btn-white sm:w-auto" type="submit">
              Cari
            </button>
          </form>

          <div className="scrollbar-none mt-3 flex gap-1.5 overflow-x-auto pb-0.5">
            {TABS.map((item) => (
              <Link
                key={item.key}
                href={
                  item.key === "all"
                    ? `/admin/work-orders${q ? `?q=${encodeURIComponent(q)}` : ""}`
                    : `/admin/work-orders?tab=${item.key}${q ? `&q=${encodeURIComponent(q)}` : ""}`
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
                  {tabCount(item.statuses)}
                </span>
              </Link>
            ))}
          </div>
        </div>

        {items.length ? (
          <>
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full min-w-[760px] text-left text-sm">
                <thead>
                  <tr className="border-b border-white/5 text-[0.65rem] uppercase tracking-wider text-slate-500">
                    <th className="px-4 py-2.5 font-semibold sm:px-5">WO</th>
                    <th className="px-3 py-2.5 font-semibold">Pelanggan</th>
                    <th className="px-3 py-2.5 font-semibold">Instrumen</th>
                    <th className="px-3 py-2.5 font-semibold">Teknisi</th>
                    <th className="px-3 py-2.5 font-semibold">Status</th>
                    <th className="px-3 py-2.5 text-right font-semibold">
                      Estimasi
                    </th>
                    <th className="px-4 py-2.5 sm:px-5" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {items.map((order) => (
                    <tr key={order.id} className="hover:bg-white/[0.03]">
                      <td className="px-4 py-3 sm:px-5">
                        <Link
                          href={`/admin/work-orders/${order.id}`}
                          className="font-mono text-xs font-semibold text-brass-300 hover:text-brass-200"
                        >
                          {order.orderNumber}
                        </Link>
                        <p className="mt-0.5 text-[0.65rem] text-slate-600">
                          {order._count.items} item
                          {order.booking
                            ? ` · ${order.booking.bookingNumber}`
                            : ""}
                        </p>
                      </td>
                      <td className="px-3 py-3">
                        <p className="font-medium text-slate-200">
                          {order.customer.name}
                        </p>
                        <p className="text-[0.65rem] text-slate-500">
                          {order.customer.whatsapp}
                        </p>
                      </td>
                      <td className="px-3 py-3">
                        <p className="text-slate-300">{order.instrumentType}</p>
                        <p className="text-[0.65rem] text-slate-500">
                          {[order.brand, order.model]
                            .filter(Boolean)
                            .join(" ") || "-"}
                        </p>
                      </td>
                      <td className="px-3 py-3">
                        {order.technician ? (
                          <span className="text-slate-300">
                            {order.technician.user.name}
                          </span>
                        ) : (
                          <span className="text-amber-400/80">
                            Belum ditugaskan
                          </span>
                        )}
                      </td>
                      <td className="px-3 py-3">
                        <StatusBadge status={order.status} kind="order" />
                        {order.invoice ? (
                          <p className="mt-1 text-[0.65rem] text-emerald-400">
                            Invoice terbit
                          </p>
                        ) : null}
                      </td>
                      <td className="px-3 py-3 text-right">
                        <p className="font-medium text-slate-200">
                          {formatIDR(order.estimateCost)}
                        </p>
                        <p className="text-[0.65rem] text-slate-500">
                          {relativeTime(order.updatedAt)}
                        </p>
                      </td>
                      <td className="px-4 py-3 text-right sm:px-5">
                        <Link
                          href={`/admin/work-orders/${order.id}`}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 hover:bg-white/5 hover:text-white"
                          aria-label={`Buka ${order.orderNumber}`}
                        >
                          <Icon name="chevron-right" className="h-4 w-4" />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <ul className="divide-y divide-white/5 md:hidden">
              {items.map((order) => (
                <li key={order.id}>
                  <Link
                    href={`/admin/work-orders/${order.id}`}
                    className="block px-4 py-3.5 hover:bg-white/[0.03]"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono text-xs font-semibold text-brass-300">
                        {order.orderNumber}
                      </span>
                      <StatusBadge status={order.status} kind="order" />
                    </div>
                    <p className="mt-1.5 text-sm font-semibold text-white">
                      {order.customer.name}
                    </p>
                    <p className="text-xs text-slate-500">
                      {order.instrumentType}
                      {order.brand ? ` · ${order.brand}` : ""}
                    </p>
                    <div className="mt-2 flex items-center justify-between text-xs">
                      <span className="text-slate-500">
                        {order.technician?.user.name ?? "Belum ada teknisi"}
                      </span>
                      <span className="font-semibold text-slate-300">
                        {formatIDR(order.estimateCost)}
                      </span>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          </>
        ) : (
          <div className="p-4">
            <EmptyState
              icon={<Icon name="wrench" className="h-5 w-5" />}
              title="Tidak ada work order"
              description={
                q
                  ? "Tidak ada hasil untuk pencarian tersebut."
                  : "Work order dibuat dari booking atau saat alat diterima."
              }
              action={
                hasPermission(user.role, "WORKORDER_CREATE") ? (
                  <NewWorkOrderButton
                    customers={customers}
                    technicians={technicians}
                  />
                ) : null
              }
            />
          </div>
        )}

        {total > 0 ? (
          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-white/10 px-4 py-3 text-xs text-slate-500 sm:px-5">
            <p>
              Menampilkan {(page - 1) * PER_PAGE + 1}–
              {Math.min(page * PER_PAGE, total)} dari {total} work order
            </p>
            <div className="flex items-center gap-1">
              <Link
                href={hrefFor(Math.max(1, page - 1))}
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
