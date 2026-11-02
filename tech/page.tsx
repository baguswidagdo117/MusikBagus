import Link from "next/link";
import { prisma } from "@/lib/db";
import { requirePermission } from "@/lib/auth";
import { hasPermission } from "@/lib/permissions";
import { formatDateTime, formatIDR } from "@/lib/utils";
import { StatusBadge } from "@/components/ui";
import { Icon } from "@/components/icons";

export const dynamic = "force-dynamic";

export default async function TechDashboardPage() {
  const user = await requirePermission("WORKORDER_VIEW");

  const tech = await prisma.technician.findUnique({
    where: { userId: user.id },
    select: { id: true, specialization: true },
  });

  if (!tech) {
    return (
      <div className="min-h-dvh">
        <div className="panel rounded-2xl p-6 mx-auto mt-10 max-w-md">
          <div className="text-center">
            <Icon name="alert" className="mx-auto mb-3 h-8 w-8 text-rose-400" />
            <h2 className="font-display text-xl font-bold text-white">
              Profil Teknisi Tidak Ditemukan
            </h2>
            <p className="mt-2 text-sm text-slate-400">
              Akun Anda belum terhubung dengan profil teknisi. Hubungi admin.
            </p>
            <Link
              href="/login"
              className="mt-4 inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.02] px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-white/5"
            >
              <Icon name="logout" className="h-4 w-4" />
              Keluar
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const [items] = await Promise.all([
    prisma.serviceOrder.findMany({
      where: { technicianId: tech.id },
      include: {
        customer: true,
        items: true,
        invoice: { select: { invoiceNumber: true, status: true } },
        _count: { select: { items: true } },
      },
      orderBy: { updatedAt: "desc" },
    }),
  ]);

  const activeItems = items.filter((o) =>
    ["RECEIVED", "DIAGNOSING", "WAITING_APPROVAL", "IN_PROGRESS"].includes(o.status),
  );
  const completedItems = items.filter((o) =>
    ["COMPLETED", "READY_FOR_PICKUP", "PAID", "CLOSED"].includes(o.status),
  );

  return (
    <div className="min-h-dvh bg-ink-950">
      <header className="border-b border-white/10 bg-ink-950/80 backdrop-blur sticky top-0 z-20">
        <div className="flex items-center justify-between px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-brass-500/15 text-brass-300">
              <Icon name="wrench" className="h-5 w-5" />
            </div>
            <div>
              <h1 className="font-display text-lg font-bold text-white">
                Pekerjaan Teknisi
              </h1>
              <p className="text-xs text-slate-400">
                {user.name} · {tech.specialization || "Teknisi Umum"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/"
              className="hidden h-9 items-center gap-2 rounded-lg border border-white/10 px-3 text-xs font-semibold text-slate-300 hover:bg-white/5 sm:flex"
            >
              <Icon name="external" className="h-3 w-3" />
              Website
            </Link>
            <Link
              href="/login"
              className="h-9 items-center gap-2 rounded-lg border border-white/10 px-3 text-xs font-semibold text-rose-300 hover:bg-rose-500/10"
              onClick={(e) => {
                e.preventDefault();
                fetch("/api/auth/logout", { method: "POST" }).then(() => {
                  window.location.assign("/login");
                });
              }}
            >
              <Icon name="logout" className="h-3 w-3" />
              Keluar
            </Link>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
            <p className="text-[0.65rem] font-semibold uppercase tracking-wider text-slate-400">
              Pekerjaan Aktif
            </p>
            <p className="mt-2 font-display text-2xl font-bold text-white">
              {activeItems.length}
            </p>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
            <p className="text-[0.65rem] font-semibold uppercase tracking-wider text-slate-400">
              Selesai
            </p>
            <p className="mt-2 font-display text-2xl font-bold text-emerald-400">
              {completedItems.length}
            </p>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
            <p className="text-[0.65rem] font-semibold uppercase tracking-wider text-slate-400">
              Total Item
            </p>
            <p className="mt-2 font-display text-2xl font-bold text-white">
              {items.reduce((sum, o) => sum + o._count.items, 0)}
            </p>
          </div>
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <section className="rounded-xl border border-white/10 bg-white/[0.02] overflow-hidden">
            <div className="border-b border-white/10 px-4 py-3">
              <h2 className="font-display text-lg font-bold text-white">
                Dikerjakan ({activeItems.length})
              </h2>
            </div>
            <div className="divide-y divide-white/5">
              {activeItems.length ? (
                activeItems.map((order) => (
                  <div key={order.id} className="px-4 py-3">
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <Link
                          href={`/tech/order/${order.id}`}
                          className="text-sm font-medium text-white hover:text-brass-200"
                        >
                          {order.orderNumber}
                        </Link>
                        <p className="text-[0.65rem] text-slate-500">
                          {order.customer.name} · {order.instrumentType}
                        </p>
                      </div>
                      <StatusBadge status={order.status} kind="order" />
                    </div>
                    <p className="mt-1 text-xs text-slate-400">
                      {formatDateTime(order.updatedAt)}
                    </p>
                  </div>
                ))
              ) : (
                <div className="px-4 py-6 text-center text-xs text-slate-500">
                  Tidak ada pekerjaan aktif.
                </div>
              )}
            </div>
          </section>

          <section className="rounded-xl border border-white/10 bg-white/[0.02] overflow-hidden">
            <div className="border-b border-white/10 px-4 py-3">
              <h2 className="font-display text-lg font-bold text-white">
                Selesai ({completedItems.length})
              </h2>
            </div>
            <div className="divide-y divide-white/5">
              {completedItems.length ? (
                completedItems.map((order) => (
                  <div key={order.id} className="px-4 py-3">
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <Link
                          href={`/tech/order/${order.id}`}
                          className="text-sm font-medium text-white hover:text-brass-200"
                        >
                          {order.orderNumber}
                        </Link>
                        <p className="text-[0.65rem] text-slate-500">
                          {order.customer.name} · {formatIDR(order.estimateCost)}
                        </p>
                      </div>
                      <StatusBadge status={order.status} kind="order" />
                    </div>
                    <p className="mt-1 text-xs text-slate-400">
                      {formatDateTime(order.updatedAt)}
                    </p>
                  </div>
                ))
              ) : (
                <div className="px-4 py-6 text-center text-xs text-slate-500">
                  Belum ada pekerjaan selesai.
                </div>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
