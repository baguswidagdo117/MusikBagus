import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { requirePermission } from "@/lib/auth";
import { formatDateTime, formatIDR } from "@/lib/utils";
import { StatusBadge } from "@/components/ui";
import { Icon } from "@/components/icons";

export const dynamic = "force-dynamic";

export default async function TechOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requirePermission("WORKORDER_VIEW");
  const { id } = await params;

  const tech = await prisma.technician.findUnique({
    where: { userId: user.id },
    select: { id: true },
  });

  if (!tech) notFound();

  const order = await prisma.serviceOrder.findUnique({
    where: { id },
    include: {
      customer: true,
      items: {
        orderBy: { id: "asc" },
        include: { inventory: true },
      },
      invoice: true,
      payments: true,
      booking: { select: { bookingNumber: true, status: true } },
    },
  });

  if (!order || order.technicianId !== tech.id) notFound();

  const itemsTotal = order.items.reduce(
    (sum, item) => sum + Number(item.subtotal),
    0,
  );
  const total = Number(order.serviceFee) + itemsTotal;
  const paid = order.payments.reduce(
    (sum, p) => sum + Number(p.amount),
    0,
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
                {order.orderNumber}
              </h1>
              <p className="text-xs text-slate-400">
                {order.customer.name} · {order.instrumentType}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <a
              href={`https://wa.me/${order.customer.whatsapp.replace(/\D/g, "")}`}
              target="_blank"
              rel="noreferrer"
              className="hidden sm:inline-flex items-center gap-2 rounded-lg border border-white/10 px-3 py-2 text-xs font-semibold text-slate-300 hover:bg-white/5"
            >
              <Icon name="whatsapp" className="h-3 w-3" />
              Hubungi Pelanggan
            </a>
            <Link
              href="/tech"
              className="h-9 items-center gap-2 rounded-lg border border-white/10 px-3 text-xs font-semibold text-slate-300 hover:bg-white/5"
            >
              <Icon name="arrow-left" className="h-3 w-3" />
              Kembali
            </Link>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-6">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-display text-xl font-bold text-white">
                Detail Pekerjaan
              </h2>
              <StatusBadge status={order.status} kind="order" />
            </div>
            <p className="text-sm text-slate-400 mt-1">
              {order.instrumentType}{order.brand ? ` ${order.brand}` : ""}{order.model ? ` ${order.model}` : ""}
            </p>
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          <section className="lg:col-span-2 space-y-4">
            <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4 sm:p-5">
              <h3 className="font-display text-base font-bold text-white mb-3">
                Data Alat & Keluhan
              </h3>
              <dl className="grid gap-3 sm:grid-cols-2 text-sm">
                <div className="col-span-2">
                  <dt className="text-[0.65rem] uppercase tracking-wider text-slate-500">
                    Pelanggan
                  </dt>
                  <dd className="mt-0.5 font-medium text-white">
                    {order.customer.name}
                  </dd>
                </div>
                <div className="col-span-2">
                  <dt className="text-[0.65rem] uppercase tracking-wider text-slate-500">
                    WhatsApp
                  </dt>
                  <dd className="mt-0.5 text-slate-300 font-mono text-xs">
                    {order.customer.whatsapp}
                  </dd>
                </div>
                <div>
                  <dt className="text-[0.65rem] uppercase tracking-wider text-slate-500">
                    Jenis Alat
                  </dt>
                  <dd className="mt-0.5 text-slate-300">
                    {order.instrumentType}
                  </dd>
                </div>
                <div>
                  <dt className="text-[0.65rem] uppercase tracking-wider text-slate-500">
                    Merek
                  </dt>
                  <dd className="mt-0.5 text-slate-300">
                    {order.brand || "-"}
                  </dd>
                </div>
                <div>
                  <dt className="text-[0.65rem] uppercase tracking-wider text-slate-500">
                    Model
                  </dt>
                  <dd className="mt-0.5 text-slate-300">
                    {order.model || "-"}
                  </dd>
                </div>
                <div className="col-span-2">
                  <dt className="text-[0.65rem] uppercase tracking-wider text-slate-500">
                    Keluhan
                  </dt>
                  <dd className="mt-0.5 whitespace-pre-line text-slate-300">
                    {order.complaint}
                  </dd>
                </div>
                <div className="col-span-2">
                  <dt className="text-[0.65rem] uppercase tracking-wider text-slate-500">
                    Kondisi Awal
                  </dt>
                  <dd className="mt-0.5 text-slate-300">
                    {order.initialCondition || "-"}
                  </dd>
                </div>
                <div className="col-span-2">
                  <dt className="text-[0.65rem] uppercase tracking-wider text-slate-500">
                    Diagnosis
                  </dt>
                  <dd className="mt-0.5 whitespace-pre-line text-slate-300">
                    {order.diagnosis || "-"}
                  </dd>
                </div>
                <div className="col-span-2">
                  <dt className="text-[0.65rem] uppercase tracking-wider text-slate-500">
                    Catatan Teknisi
                  </dt>
                  <dd className="mt-0.5 whitespace-pre-line text-slate-300">
                    {order.technicianNotes || "-"}
                  </dd>
                </div>
              </dl>
            </div>

            {order.items.length > 0 && (
              <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4 sm:p-5">
                <h3 className="font-display text-base font-bold text-white mb-3">
                  Item Pekerjaan
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[640px] text-left text-sm">
                    <thead>
                      <tr className="border-b border-white/5 text-[0.65rem] uppercase tracking-wider text-slate-500">
                        <th className="px-4 py-2.5 font-semibold sm:px-5">Jenis</th>
                        <th className="px-3 py-2.5 font-semibold">Deskripsi</th>
                        <th className="px-3 py-2.5 text-center font-semibold">Qty</th>
                        <th className="px-3 py-2.5 text-right font-semibold">Harga Satuan</th>
                        <th className="px-3 py-2.5 text-right font-semibold">Subtotal</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {order.items.map((item) => (
                        <tr key={item.id} className="hover:bg-white/[0.03]">
                          <td className="px-4 py-3 sm:px-5 text-slate-400 font-mono text-xs">
                            {item.type === "JASA" ? "Jasa" : item.type === "PART" ? "Part" : "Lainnya"}
                          </td>
                          <td className="px-3 py-3 text-slate-300">
                            {item.description}
                          </td>
                          <td className="px-3 py-3 text-center text-slate-300">
                            {item.qty}
                          </td>
                          <td className="px-3 py-3 text-right text-slate-300">
                            {formatIDR(item.unitPrice)}
                          </td>
                          <td className="px-3 py-3 text-right text-white">
                            {formatIDR(item.subtotal)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </section>

          <section className="space-y-4">
            <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4 sm:p-5">
              <h3 className="font-display text-base font-bold text-white mb-3">
                Ringkasan Biaya
              </h3>
              <dl className="space-y-2 text-sm">
                <div className="flex justify-between text-slate-400">
                  <dt>Biaya jasa</dt>
                  <dd className="text-slate-200 font-mono">
                    {formatIDR(order.serviceFee)}
                  </dd>
                </div>
                <div className="flex justify-between text-slate-400">
                  <dt>Item</dt>
                  <dd className="text-slate-200 font-mono">
                    {formatIDR(itemsTotal)}
                  </dd>
                </div>
                <div className="flex justify-between border-t border-white/10 pt-2 font-semibold text-white">
                  <dt>Total</dt>
                  <dd className="font-mono">{formatIDR(total)}</dd>
                </div>
                <div className="flex justify-between text-slate-400">
                  <dt>Terbayar</dt>
                  <dd className="text-emerald-300 font-mono">
                    {formatIDR(paid)}
                  </dd>
                </div>
                <div className="flex justify-between text-slate-400">
                  <dt>Sisa</dt>
                  <dd className="text-amber-400 font-mono">
                    {formatIDR(Math.max(0, total - paid))}
                  </dd>
                </div>
              </dl>
              {order.invoice && (
                <div className="mt-4 rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-3">
                  <p className="text-xs font-semibold uppercase tracking-wider text-emerald-400 mb-1">
                    Invoice
                  </p>
                  <p className="font-mono text-xs text-emerald-300">
                    {order.invoice.invoiceNumber}
                  </p>
                  <Link
                    href={`/invoice/${order.invoice.invoiceNumber}`}
                    target="_blank"
                    className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-brass-300 hover:text-brass-200"
                  >
                    <Icon name="external" className="h-3 w-3" />
                    Buka Invoice
                  </Link>
                </div>
              )}
            </div>

            <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4 sm:p-5">
              <h3 className="font-display text-base font-bold text-white mb-3">
                Informasi
              </h3>
              <dl className="space-y-2 text-sm">
                <div className="flex justify-between text-slate-400">
                  <dt>Teknisi</dt>
                  <dd className="text-slate-200">{user.name}</dd>
                </div>
                <div className="flex justify-between text-slate-400">
                  <dt>Dibuat</dt>
                  <dd className="text-slate-300 font-mono text-xs">
                    {formatDateTime(order.createdAt)}
                  </dd>
                </div>
                <div className="flex justify-between text-slate-400">
                  <dt>Diperbarui</dt>
                  <dd className="text-slate-300 font-mono text-xs">
                    {formatDateTime(order.updatedAt)}
                  </dd>
                </div>
                {order.estimatedDone && (
                  <div className="flex justify-between text-slate-400">
                    <dt>Estimasi Selesai</dt>
                    <dd className="text-slate-300 font-mono text-xs">
                      {formatDateTime(order.estimatedDone)}
                    </dd>
                  </div>
                )}
              </dl>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
