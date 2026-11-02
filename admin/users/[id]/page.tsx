import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { requirePermission } from "@/lib/auth";
import { ROLE_LABEL } from "@/lib/permissions";
import { cn, formatDateTime } from "@/lib/utils";
import { AdminPageHeader } from "@/components/admin/page-header";
import { StatCard } from "@/components/ui";
import { Icon } from "@/components/icons";

export const dynamic = "force-dynamic";

const ROLE_COLOR: Record<string, string> = {
  OWNER: "text-amber-400",
  ADMIN: "text-sky-400",
  KASIR: "text-emerald-400",
  TEKNISI: "text-purple-400",
} as const;

export default async function UserDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requirePermission("USER_MANAGE");
  const { id } = await params;

  const staff = await prisma.user.findUnique({
    where: { id },
    include: {
      technician: true,
      _count: {
        select: { sales: true, payments: true, inventoryTx: true, auditLogs: true },
      },
    },
  });

  if (!staff) notFound();

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-2 text-xs text-slate-500">
        <Link
          href="/admin/users"
          className="inline-flex items-center gap-1 font-semibold text-slate-400 hover:text-white"
        >
          <Icon name="arrow-left" className="h-3.5 w-3.5" />
          Pengguna
        </Link>
        <span>/</span>
        <span className="font-mono text-slate-400">{staff.name}</span>
      </div>

      <AdminPageHeader
        title={staff.name}
        description={`${ROLE_LABEL[staff.role as keyof typeof ROLE_LABEL] ?? staff.role} · ${staff.email}`}
        actions={
          <>
            <Link
              href={`/admin/users/${staff.id}/edit`}
              className="btn-white"
            >
              <Icon name="edit" className="h-4 w-4" />
              Edit
            </Link>
          </>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Peran"
          value={ROLE_LABEL[staff.role as keyof typeof ROLE_LABEL] ?? staff.role}
          hint={staff.role}
          icon={<Icon name="shield" className="h-5 w-5" />}
        />
        <StatCard
          label="Status"
          value={staff.active ? "Aktif" : "Nonaktif"}
          tone={staff.active ? "good" : "bad"}
          icon={<Icon name="shield" className="h-5 w-5" />}
        />
        <StatCard
          label="Transaksi POS"
          value={String(staff._count.sales)}
          hint="Sebagai kasir"
          icon={<Icon name="receipt" className="h-5 w-5" />}
        />
        <StatCard
          label="Pembayaran"
          value={String(staff._count.payments)}
          hint="Terjadi"
          icon={<Icon name="wallet" className="h-5 w-5" />}
        />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <section className="panel p-4 sm:p-5">
          <div className="flex flex-col gap-2">
            <p className="text-[0.65rem] font-semibold uppercase tracking-wider text-slate-400">
              Nama Lengkap
            </p>
            <p className="text-sm font-semibold text-white">{staff.name}</p>
          </div>
          <div className="mt-4 flex flex-col gap-2">
            <p className="text-[0.65rem] font-semibold uppercase tracking-wider text-slate-400">
              Email
            </p>
            <p className="text-sm text-slate-300 font-mono">
              {staff.email}
            </p>
          </div>
          <div className="mt-4 flex flex-col gap-2">
            <p className="text-[0.65rem] font-semibold uppercase tracking-wider text-slate-400">
              Peran
            </p>
            <p className={cn(
              "text-sm font-semibold",
              ROLE_COLOR[staff.role as keyof typeof ROLE_COLOR] || "text-slate-300",
            )}>
              {ROLE_LABEL[staff.role as keyof typeof ROLE_LABEL] ?? staff.role}
            </p>
          </div>
          <div className="mt-4 flex flex-col gap-2">
            <p className="text-[0.65rem] font-semibold uppercase tracking-wider text-slate-400">
              Telepon
            </p>
            <p className="text-sm text-slate-300 font-mono">
              {staff.phone || "-"}
            </p>
          </div>
          <div className="mt-4 flex flex-col gap-2">
            <p className="text-[0.65rem] font-semibold uppercase tracking-wider text-slate-400">
              Status Akun
            </p>
            <span
              className={cn(
                "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[0.65rem]",
                staff.active
                  ? "bg-emerald-500/10 text-emerald-300 ring-emerald-500/30"
                  : "bg-rose-500/10 text-rose-300 ring-rose-500/30",
              )}
            >
              {staff.active ? "Aktif" : "Nonaktif"}
            </span>
          </div>
          <div className="mt-4 flex flex-col gap-2">
            <p className="text-[0.65rem] font-semibold uppercase tracking-wider text-slate-400">
              Terdaftar
            </p>
            <p className="text-sm text-slate-300">
              {formatDateTime(staff.createdAt)}
            </p>
          </div>
        </section>

        <section className="panel overflow-hidden lg:col-span-2">
          <div className="border-b border-white/10 px-4 py-3.5 sm:px-5">
            <h2 className="font-display text-base font-bold text-white">
              Aktivitas
            </h2>
            <p className="text-xs text-slate-500">
              Transaksi, pembayaran, dan log audit terkait
            </p>
          </div>
          <div className="grid gap-3 p-4">
            <div className="rounded-lg border border-white/10 p-3">
              <p className="text-[0.65rem] uppercase tracking-wider text-slate-400 mb-1">
                Audit Log
              </p>
              <p className="text-sm font-semibold text-white">
                {staff._count.auditLogs} catatan
              </p>
            </div>
            <div className="rounded-lg border border-white/10 p-3">
              <p className="text-[0.65rem] uppercase tracking-wider text-slate-400 mb-1">
                Stok yang dikelola
              </p>
              <p className="text-sm font-semibold text-white">
                {staff._count.inventoryTx} transaksi
              </p>
            </div>
            {staff.technician ? (
              <div className="rounded-lg border border-white/10 p-3">
                <p className="text-[0.65rem] uppercase tracking-wider text-slate-400 mb-1">
                  Spesialisasi Teknisi
                </p>
                <p className="text-sm text-slate-300">
                  {staff.technician.specialization || "-"}
                </p>
              </div>
            ) : null}
          </div>
        </section>
      </div>
    </div>
  );
}
