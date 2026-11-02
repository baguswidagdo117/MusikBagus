import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { requirePermission } from "@/lib/auth";
import { hasPermission } from "@/lib/permissions";
import { cn, formatDateTime, formatIDR, relativeTime, toNumber } from "@/lib/utils";
import { PAYMENT_METHOD_LABEL, timelineForStatus } from "@/lib/status";
import { StatusBadge } from "@/components/ui";
import { Icon } from "@/components/icons";
import { WorkOrderManager } from "@/components/admin/work-order-manager";
import { PaymentForm } from "@/components/admin/payment-form";
import { CreateInvoiceButton } from "@/components/admin/invoice-button";

export const dynamic = "force-dynamic";

function waLink(phone: string) {
  const digits = phone.replace(/\D/g, "");
  return `https://wa.me/${digits.startsWith("0") ? `62${digits.slice(1)}` : digits}`;
}

export default async function WorkOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requirePermission("WORKORDER_VIEW");
  const { id } = await params;

  const [order, technicianRows, services, inventory] = await Promise.all([
    prisma.serviceOrder.findUnique({
      where: { id },
      include: {
        customer: true,
        technician: { include: { user: true } },
        booking: { select: { id: true, bookingNumber: true, status: true } },
        items: { orderBy: { id: "asc" } },
        payments: {
          include: { cashier: { select: { name: true } } },
          orderBy: { paidAt: "desc" },
        },
        invoice: true,
      },
    }),
    prisma.technician.findMany({
      where: { active: true },
      include: { user: { select: { name: true } } },
    }),
    prisma.service.findMany({ where: { active: true }, orderBy: { name: "asc" } }),
    prisma.inventory.findMany({
      where: { active: true },
      orderBy: { name: "asc" },
    }),
  ]);

  if (!order) notFound();

  if (user.role === "TEKNISI") {
    const tech = await prisma.technician.findUnique({
      where: { userId: user.id },
      select: { id: true },
    });
    if (!tech || order.technicianId !== tech.id) notFound();
  }

  const canUpdate = hasPermission(user.role, "WORKORDER_UPDATE");
  const canManageFinance =
    user.role === "OWNER" || user.role === "ADMIN";
  const canAssign = canManageFinance;
  const canPay = hasPermission(user.role, "POS_PAYMENT");
  const canCreateInvoice = hasPermission(user.role, "POS_CREATE");

  const items = order.items.map((item) => ({
    id: item.id,
    type: item.type,
    description: item.description,
    qty: item.qty,
    unitPrice: toNumber(item.unitPrice),
    subtotal: toNumber(item.subtotal),
  }));
  const itemsTotal = items.reduce((sum, item) => sum + item.subtotal, 0);
  const total = toNumber(order.serviceFee) + itemsTotal;
  const paid = order.payments.reduce(
    (sum, payment) =>
      sum +
      (payment.type === "REFUND"
        ? -toNumber(payment.amount)
        : toNumber(payment.amount)),
    0,
  );
  const remaining = Math.max(0, total - paid);
  const timeline = timelineForStatus("order", order.status);
  const cancelled = order.status === "CANCELLED";

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-2 text-xs text-slate-500">
        <Link
          href="/admin/work-orders"
          className="inline-flex items-center gap-1 font-semibold text-slate-400 hover:text-white"
        >
          <Icon name="arrow-left" className="h-3.5 w-3.5" />
          Work Order
        </Link>
        <span>/</span>
        <span className="font-mono text-slate-400">{order.orderNumber}</span>
      </div>

      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="font-display text-2xl font-bold text-white sm:text-3xl">
              {order.orderNumber}
            </h1>
            <StatusBadge status={order.status} kind="order" />
            {order.invoice ? (
              <span className="badge bg-emerald-500/10 text-emerald-300 ring-emerald-500/30">
                Invoice
              </span>
            ) : null}
          </div>
          <p className="mt-1 text-sm text-slate-400">
            {order.customer.name} · {order.instrumentType}
            {order.brand ? ` ${order.brand}` : ""} · Diperbarui{" "}
            {relativeTime(order.updatedAt)}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {order.booking ? (
            <Link
              href={`/admin/bookings/${order.booking.id}`}
              className="btn-ghost-dark"
            >
              <Icon name="clipboard" className="h-4 w-4" />
              {order.booking.bookingNumber}
            </Link>
          ) : null}
          <a
            href={waLink(order.customer.whatsapp)}
            target="_blank"
            rel="noreferrer"
            className="btn-white"
          >
            <Icon name="whatsapp" className="h-4 w-4" />
            WhatsApp
          </a>
          {order.invoice ? (
            <Link
              href={`/invoice/${order.invoice.invoiceNumber}`}
              target="_blank"
              className="btn-primary"
            >
              <Icon name="file" className="h-4 w-4" />
              Lihat Invoice
            </Link>
          ) : canCreateInvoice && total > 0 ? (
            <CreateInvoiceButton orderId={order.id} />
          ) : null}
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <WorkOrderManager
            order={{
              id: order.id,
              status: order.status,
              instrumentType: order.instrumentType,
              brand: order.brand,
              model: order.model,
              serialNumber: order.serialNumber,
              initialCondition: order.initialCondition,
              diagnosis: order.diagnosis,
              technicianNotes: order.technicianNotes,
              estimatedDone: order.estimatedDone?.toISOString() ?? null,
              serviceFee: toNumber(order.serviceFee),
              estimateCost: toNumber(order.estimateCost),
              technicianId: order.technicianId,
              beforePhoto: order.beforePhoto,
              afterPhoto: order.afterPhoto,
              updatedAt: order.updatedAt.toISOString(),
            }}
            technicians={technicianRows.map((technician) => ({
              id: technician.id,
              name: technician.user.name,
            }))}
            services={services.map((service) => ({
              id: service.id,
              name: service.name,
              price: toNumber(service.price),
            }))}
            inventory={inventory.map((part) => ({
              id: part.id,
              name: part.name,
              sellPrice: toNumber(part.sellPrice),
              stock: part.stock,
              unit: part.unit,
            }))}
            items={items}
            canUpdate={canUpdate}
            canManageFinance={canManageFinance}
            canAssign={canAssign}
          />
        </div>

        <div className="space-y-4">
          <section className="panel p-4 sm:p-5">
            <h2 className="font-display text-base font-bold text-white">
              Pelanggan
            </h2>
            <div className="mt-3">
              <p className="text-sm font-semibold text-white">
                {order.customer.name}
              </p>
              <p className="text-xs text-slate-400">
                {order.customer.whatsapp}
              </p>
              {order.customer.email ? (
                <p className="text-xs text-slate-500">
                  {order.customer.email}
                </p>
              ) : null}
            </div>
            <div className="mt-3 rounded-xl bg-white/[0.03] p-3">
              <p className="text-[0.65rem] uppercase tracking-wider text-slate-500">
                Keluhan
              </p>
              <p className="mt-1 whitespace-pre-line text-xs leading-relaxed text-slate-300">
                {order.complaint}
              </p>
            </div>
            <Link
              href={`/admin/customers/${order.customerId}`}
              className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-brass-300 hover:text-brass-200"
            >
              Lihat profil pelanggan
              <Icon name="arrow-right" className="h-3 w-3" />
            </Link>
          </section>

          <section className="panel p-4 sm:p-5">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-base font-bold text-white">
                Ringkasan Biaya
              </h2>
              <Icon name="wallet" className="h-4 w-4 text-slate-500" />
            </div>
            <dl className="mt-3 space-y-1.5 text-sm">
              <div className="flex justify-between text-slate-400">
                <dt>Biaya jasa</dt>
                <dd className="text-slate-200">
                  {formatIDR(order.serviceFee)}
                </dd>
              </div>
              <div className="flex justify-between text-slate-400">
                <dt>Jasa & part</dt>
                <dd className="text-slate-200">{formatIDR(itemsTotal)}</dd>
              </div>
              <div className="flex justify-between border-t border-white/10 pt-2 font-semibold text-white">
                <dt>Total</dt>
                <dd>{formatIDR(total)}</dd>
              </div>
              <div className="flex justify-between text-slate-400">
                <dt>Terbayar</dt>
                <dd className="text-emerald-300">{formatIDR(paid)}</dd>
              </div>
              <div className="flex items-center justify-between rounded-lg bg-white/[0.04] px-2.5 py-2">
                <dt className="text-xs font-semibold text-slate-300">
                  Sisa tagihan
                </dt>
                <dd className="font-display text-base font-bold text-white">
                  {formatIDR(remaining)}
                </dd>
              </div>
            </dl>
            {order.invoice ? (
              <div className="mt-3 rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-2.5 text-xs">
                <p className="font-semibold text-emerald-300">
                  {order.invoice.invoiceNumber}
                </p>
                <div className="mt-1 flex items-center justify-between">
                  <Link
                    href={`/invoice/${order.invoice.invoiceNumber}`}
                    target="_blank"
                    className="font-medium text-slate-300 hover:text-white"
                  >
                    Buka invoice
                  </Link>
                  <StatusBadge
                    status={order.invoice.status}
                    className="normal-case tracking-normal"
                  />
                </div>
              </div>
            ) : canCreateInvoice && total > 0 ? (
              <div className="mt-3">
                <CreateInvoiceButton orderId={order.id} />
              </div>
            ) : null}
          </section>

          {canPay ? (
            <section className="panel p-4 sm:p-5">
              <h2 className="font-display text-base font-bold text-white">
                Catat Pembayaran
              </h2>
              <p className="text-xs text-slate-500">
                Pembayaran akan otomatis melunasi invoice bila mencapai total.
              </p>
              <PaymentForm
                orderId={order.id}
                customerId={order.customerId}
                remaining={remaining}
              />
            </section>
          ) : null}

          <section className="panel p-4 sm:p-5">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-base font-bold text-white">
                Riwayat Pembayaran
              </h2>
              <span className="text-xs text-slate-500">
                {order.payments.length} transaksi
              </span>
            </div>
            {order.payments.length ? (
              <ul className="mt-3 space-y-2">
                {order.payments.map((payment) => (
                  <li
                    key={payment.id}
                    className="flex items-start justify-between gap-2 border-b border-white/5 pb-2 text-xs last:border-0"
                  >
                    <div>
                      <p className="font-medium text-slate-200">
                        {PAYMENT_METHOD_LABEL[payment.method] ??
                          payment.method}{" "}
                        · {payment.type}
                      </p>
                      <p className="text-[0.65rem] text-slate-500">
                        {formatDateTime(payment.paidAt)}
                        {payment.cashier
                          ? ` · ${payment.cashier.name}`
                          : ""}
                      </p>
                    </div>
                    <span
                      className={
                        payment.type === "REFUND"
                          ? "font-semibold text-rose-300"
                          : "font-semibold text-emerald-300"
                      }
                    >
                      {payment.type === "REFUND" ? "-" : ""}
                      {formatIDR(payment.amount)}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-3 rounded-lg border border-dashed border-white/10 p-3 text-center text-xs text-slate-500">
                Belum ada pembayaran tercatat.
              </p>
            )}
          </section>

          <section className="panel p-4 sm:p-5">
            <h2 className="font-display text-base font-bold text-white">
              Progres Servis
            </h2>
            {cancelled ? (
              <p className="mt-3 rounded-lg border border-rose-500/20 bg-rose-500/5 p-3 text-xs text-rose-200">
                Work order dibatalkan.
              </p>
            ) : (
              <ol className="mt-3">
                {timeline.map((step, index) => (
                  <li key={step.key} className="flex gap-2.5">
                    <div className="flex flex-col items-center">
                      <span
                        className={cn(
                          "grid h-5 w-5 place-items-center rounded-full border text-[0.55rem] font-bold",
                          step.done &&
                            "border-emerald-500/40 bg-emerald-500/15 text-emerald-300",
                          step.active &&
                            "border-brass-400 bg-brass-500/20 text-brass-200",
                          !step.done &&
                            !step.active &&
                            "border-white/10 text-slate-600",
                        )}
                      >
                        {step.done ? (
                          <Icon name="check" className="h-2.5 w-2.5" />
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
                          style={{ minHeight: 16 }}
                        />
                      ) : null}
                    </div>
                    <p
                      className={cn(
                        "pb-2.5 text-xs",
                        step.active
                          ? "font-semibold text-white"
                          : step.done
                            ? "text-slate-300"
                            : "text-slate-500",
                      )}
                    >
                      {step.label}
                    </p>
                  </li>
                ))}
              </ol>
            )}
            <div className="mt-3 border-t border-white/10 pt-3 text-[0.65rem] text-slate-500">
              <p>Dibuat {formatDateTime(order.createdAt)}</p>
              <p className="mt-0.5">
                Teknisi:{" "}
                {order.technician?.user.name ?? "Belum ditugaskan"}
              </p>
              {order.estimatedDone ? (
                <p className="mt-0.5">
                  Estimasi selesai:{" "}
                  {formatDateTime(order.estimatedDone)}
                </p>
              ) : null}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
