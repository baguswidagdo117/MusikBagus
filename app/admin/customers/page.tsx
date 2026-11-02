import Link from "next/link";
import { prisma } from "@/lib/db";
import { requirePermission } from "@/lib/auth";
import { hasPermission } from "@/lib/permissions";
import { cn, formatDate, initials } from "@/lib/utils";
import { AdminPageHeader } from "@/components/admin/page-header";
import { CustomerFormDialog } from "@/components/admin/customer-form";
import { EmptyState } from "@/components/ui";
import { Icon } from "@/components/icons";

export const dynamic = "force-dynamic";

const PER_PAGE = 20;

export default async function CustomersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string }>;
}) {
  const user = await requirePermission("CUSTOMER_VIEW");
  const { q = "", page: pageParam } = await searchParams;
  const page = Math.max(1, Number(pageParam) || 1);
  const where = q
    ? {
        OR: [
          { name: { contains: q } },
          { whatsapp: { contains: q } },
          { code: { contains: q } },
          { email: { contains: q } },
        ],
      }
    : {};

  const [items, total] = await Promise.all([
    prisma.customer.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PER_PAGE,
      take: PER_PAGE,
      include: {
        _count: { select: { bookings: true, serviceOrders: true, sales: true } },
      },
    }),
    prisma.customer.count({ where }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / PER_PAGE));
  const hrefFor = (nextPage: number) => {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (nextPage > 1) params.set("page", String(nextPage));
    const query = params.toString();
    return `/admin/customers${query ? `?${query}` : ""}`;
  };

  return (
    <div>
      <AdminPageHeader
        eyebrow="Data"
        title="Pelanggan"
        description="Database pelanggan beserta riwayat servis dan transaksi."
        actions={
          hasPermission(user.role, "CUSTOMER_CREATE") ? (
            <CustomerFormDialog />
          ) : null
        }
      />

      <div className="panel overflow-hidden">
        <div className="border-b border-white/10 p-3 sm:p-4">
          <form action="/admin/customers" method="get" className="flex gap-2">
            <div className="relative flex-1">
              <Icon
                name="search"
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500"
              />
              <input
                name="q"
                defaultValue={q}
                placeholder="Cari nama, WhatsApp, kode pelanggan..."
                className="input-dark pl-9"
                aria-label="Cari pelanggan"
              />
            </div>
            <button type="submit" className="btn-white">
              Cari
            </button>
            {q ? (
              <Link href="/admin/customers" className="btn-ghost-dark">
                Reset
              </Link>
            ) : null}
          </form>
        </div>

        {items.length ? (
          <>
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full min-w-[680px] text-left text-sm">
                <thead>
                  <tr className="border-b border-white/5 text-[0.65rem] uppercase tracking-wider text-slate-500">
                    <th className="px-4 py-2.5 font-semibold sm:px-5">
                      Pelanggan
                    </th>
                    <th className="px-3 py-2.5 font-semibold">Kontak</th>
                    <th className="px-3 py-2.5 text-center font-semibold">
                      Booking
                    </th>
                    <th className="px-3 py-2.5 text-center font-semibold">
                      Servis
                    </th>
                    <th className="px-3 py-2.5 text-center font-semibold">
                      Transaksi
                    </th>
                    <th className="px-3 py-2.5 font-semibold">Terdaftar</th>
                    <th className="px-4 py-2.5 sm:px-5" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {items.map((customer) => (
                    <tr key={customer.id} className="hover:bg-white/[0.03]">
                      <td className="px-4 py-3 sm:px-5">
                        <div className="flex items-center gap-2.5">
                          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-brass-500/15 text-[0.65rem] font-bold text-brass-200">
                            {initials(customer.name)}
                          </span>
                          <div>
                            <Link
                              href={`/admin/customers/${customer.id}`}
                              className="font-medium text-white hover:text-brass-200"
                            >
                              {customer.name}
                            </Link>
                            <p className="font-mono text-[0.65rem] text-slate-500">
                              {customer.code}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-3">
                        <p className="text-slate-300">{customer.whatsapp}</p>
                        <p className="text-[0.65rem] text-slate-500">
                          {customer.email || "-"}
                        </p>
                      </td>
                      <td className="px-3 py-3 text-center text-slate-400">
                        {customer._count.bookings}
                      </td>
                      <td className="px-3 py-3 text-center text-slate-400">
                        {customer._count.serviceOrders}
                      </td>
                      <td className="px-3 py-3 text-center text-slate-400">
                        {customer._count.sales}
                      </td>
                      <td className="px-3 py-3 text-xs text-slate-500">
                        {formatDate(customer.createdAt)}
                      </td>
                      <td className="px-4 py-3 text-right sm:px-5">
                        <Link
                          href={`/admin/customers/${customer.id}`}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 hover:bg-white/5 hover:text-white"
                          aria-label={`Buka ${customer.name}`}
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
              {items.map((customer) => (
                <li key={customer.id}>
                  <Link
                    href={`/admin/customers/${customer.id}`}
                    className="flex items-center gap-3 px-4 py-3.5 hover:bg-white/[0.03]"
                  >
                    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-brass-500/15 text-xs font-bold text-brass-200">
                      {initials(customer.name)}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold text-white">
                        {customer.name}
                      </span>
                      <span className="block text-xs text-slate-500">
                        {customer.whatsapp} · {customer.code}
                      </span>
                      <span className="mt-0.5 block text-[0.65rem] text-slate-600">
                        {customer._count.serviceOrders} servis ·{" "}
                        {customer._count.sales} transaksi
                      </span>
                    </span>
                    <Icon
                      name="chevron-right"
                      className="h-4 w-4 text-slate-600"
                    />
                  </Link>
                </li>
              ))}
            </ul>
          </>
        ) : (
          <div className="p-4">
            <EmptyState
              icon={<Icon name="users" className="h-5 w-5" />}
              title="Belum ada pelanggan"
              description={
                q
                  ? "Tidak ada hasil untuk pencarian tersebut."
                  : "Pelanggan otomatis terdaftar saat booking pertama."
              }
              action={
                hasPermission(user.role, "CUSTOMER_CREATE") ? (
                  <CustomerFormDialog />
                ) : null
              }
            />
          </div>
        )}

        {total > 0 ? (
          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-white/10 px-4 py-3 text-xs text-slate-500 sm:px-5">
            <p>
              {(page - 1) * PER_PAGE + 1}–
              {Math.min(page * PER_PAGE, total)} dari {total} pelanggan
            </p>
            <div className="flex items-center gap-1">
              <Link
                href={hrefFor(Math.max(1, page - 1))}
                className={cn(
                  "btn-ghost-dark h-8 px-2.5 text-xs",
                  page <= 1 && "pointer-events-none opacity-40",
                )}
              >
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
              </Link>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
