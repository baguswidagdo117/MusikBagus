import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { requirePermission } from "@/lib/auth";
import { cn, formatIDR } from "@/lib/utils";
import { AdminPageHeader } from "@/components/admin/page-header";
import { StatCard } from "@/components/ui";
import { Icon } from "@/components/icons";

export const dynamic = "force-dynamic";

export default async function ServiceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requirePermission("SERVICE_VIEW");
  const { id } = await params;

  const service = await prisma.service.findUnique({
    where: { id },
    include: {
      _count: { select: { bookings: true, serviceItems: true, saleItems: true } },
    },
  });

  if (!service) notFound();

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-2 text-xs text-slate-500">
        <Link
          href="/admin/services"
          className="inline-flex items-center gap-1 font-semibold text-slate-400 hover:text-white"
        >
          <Icon name="arrow-left" className="h-3.5 w-3.5" />
          Layanan
        </Link>
        <span>/</span>
        <span className="font-mono text-slate-400">{service.code}</span>
      </div>

      <AdminPageHeader
        title={service.name}
        description={`${service.code} · ${service.category} · ${formatIDR(service.price)}`}
        actions={
          <>
            <Link
              href={`/booking?service=${service.id}`}
              className="btn-primary"
            >
              <Icon name="calendar" className="h-4 w-4" />
              Booking Layanan Ini
            </Link>
          </>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Kode Layanan"
          value={service.code}
          hint="Kode unik layanan"
          icon={<Icon name="tune" className="h-5 w-5" />}
        />
        <StatCard
          label="Harga"
          value={formatIDR(service.price)}
          hint={`per ${service.durationMin} menit`}
          tone="good"
          icon={<Icon name="wallet" className="h-5 w-5" />}
        />
        <StatCard
          label="Durasi"
          value={String(service.durationMin)}
          hint="menit"
          icon={<Icon name="clock" className="h-5 w-5" />}
        />
        <StatCard
          label="Status"
          value={service.active ? "Aktif" : "Nonaktif"}
          tone={service.active ? "good" : "warn"}
          icon={<Icon name="shield" className="h-5 w-5" />}
        />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <section className="panel p-4 sm:p-5">
          <div className="flex flex-col gap-2">
            <p className="text-[0.65rem] font-semibold uppercase tracking-wider text-slate-400">
              Kategori
            </p>
            <p className="text-sm font-semibold text-white">{service.category}</p>
          </div>
          <div className="mt-4 flex flex-col gap-2">
            <p className="text-[0.65rem] font-semibold uppercase tracking-wider text-slate-400">
              Deskripsi
            </p>
            <p className="text-sm whitespace-pre-line text-slate-300">
              {service.description || "-"}
            </p>
          </div>
          <div className="mt-4 flex flex-col gap-2">
            <p className="text-[0.65rem] font-semibold uppercase tracking-wider text-slate-400">
              Status
            </p>
            <span
              className={cn(
                "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[0.65rem]",
                service.active
                  ? "bg-emerald-500/10 text-emerald-300 ring-emerald-500/30"
                  : "bg-rose-500/10 text-rose-300 ring-rose-500/30",
              )}
            >
              {service.active ? "Aktif" : "Nonaktif"}
            </span>
          </div>
          <div className="mt-4 flex flex-col gap-2">
            <p className="text-[0.65rem] font-semibold uppercase tracking-wider text-slate-400">
              Terbaru diperbarui
            </p>
            <p className="text-sm text-slate-300">
              {service.createdAt.toISOString()}
            </p>
          </div>
        </section>

        <section className="panel overflow-hidden lg:col-span-2">
          <div className="border-b border-white/10 px-4 py-3.5 sm:px-5">
            <h2 className="font-display text-base font-bold text-white">
              Statistik Penggunaan
            </h2>
            <p className="text-xs text-slate-500">
              Booking, work order item, dan transaksi POS
            </p>
          </div>
          <div className="grid gap-3 p-4">
            <div className="rounded-lg border border-white/10 p-3">
              <p className="text-[0.65rem] uppercase tracking-wider text-slate-400 mb-1">
                Booking
              </p>
              <p className="text-sm font-semibold text-white">
                {service._count.bookings}
              </p>
            </div>
            <div className="rounded-lg border border-white/10 p-3">
              <p className="text-[0.65rem] uppercase tracking-wider text-slate-400 mb-1">
                Work Order Items
              </p>
              <p className="text-sm font-semibold text-white">
                {service._count.serviceItems}
              </p>
            </div>
            <div className="rounded-lg border border-white/10 p-3">
              <p className="text-[0.65rem] uppercase tracking-wider text-slate-400 mb-1">
                POS Sale Items
              </p>
              <p className="text-sm font-semibold text-white">
                {service._count.saleItems}
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
