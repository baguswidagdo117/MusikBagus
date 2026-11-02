import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { getSettings } from "@/lib/settings";
import { formatDate, formatIDR, toNumber } from "@/lib/utils";
import { BrandMark } from "@/components/brand";
import { Icon } from "@/components/icons";
import { PrintButton } from "@/components/print-button";
import { StatusBadge } from "@/components/ui";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Invoice",
  robots: { index: false, follow: false },
};

export default async function InvoicePage({
  params,
}: {
  params: Promise<{ number: string }>;
}) {
  const { number } = await params;
  const [invoice, settings] = await Promise.all([
    prisma.invoice.findUnique({
      where: { invoiceNumber: decodeURIComponent(number) },
      include: {
        customer: true,
        sale: {
          include: {
            items: true,
            payments: { orderBy: { paidAt: "asc" } },
            cashier: { select: { name: true } },
          },
        },
        serviceOrder: {
          include: {
            items: true,
            technician: { include: { user: { select: { name: true } } } },
          },
        },
      },
    }),
    getSettings(),
  ]);

  if (!invoice) {
    return (
      <main className="flex min-h-dvh items-center justify-center bg-paper px-4">
        <div className="w-full max-w-md rounded-3xl border border-ink-900/10 bg-white p-8 text-center shadow-sm">
          <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-rose-50 text-rose-600">
            <Icon name="alert" className="h-7 w-7" />
          </span>
          <h1 className="mt-4 font-display text-2xl font-bold text-ink-950">
            Invoice tidak ditemukan
          </h1>
          <p className="mt-2 text-sm text-ink-600">
            Periksa kembali tautan invoice Anda atau hubungi BagusMusik.
          </p>
          <Link href="/" className="btn-primary mt-6">
            Kembali ke Beranda
          </Link>
        </div>
      </main>
    );
  }

  const items =
    invoice.sale?.items.map((item) => ({
      id: item.id,
      description: item.description,
      qty: item.qty,
      unitPrice: toNumber(item.unitPrice),
      subtotal: toNumber(item.subtotal),
    })) ??
    invoice.serviceOrder?.items.map((item) => ({
      id: item.id,
      description: item.description,
      qty: item.qty,
      unitPrice: toNumber(item.unitPrice),
      subtotal: toNumber(item.subtotal),
    })) ??
    [];

  const subtotal =
    invoice.sale?.subtotal ??
    items.reduce((sum, item) => sum + item.subtotal, 0);
  const discount = invoice.sale?.discount ?? 0;
  const total = toNumber(invoice.total);
  const paid = invoice.sale ? toNumber(invoice.sale.paid) : 0;
  const due = Math.max(0, total - paid);
  const payments = invoice.sale?.payments ?? [];
  const isPaid = invoice.status === "PAID" || due <= 0;

  return (
    <main className="min-h-dvh bg-paper px-4 py-6 sm:py-10">
      <div className="mx-auto max-w-3xl">
        <div className="no-print mb-4 flex flex-wrap items-center justify-between gap-3">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm font-semibold text-ink-700 hover:text-ink-950"
          >
            <Icon name="arrow-left" className="h-4 w-4" />
            Kembali
          </Link>
          <div className="flex gap-2">
            {invoice.serviceOrder ? (
              <Link
                href={`/cek-status?no=${invoice.serviceOrder.orderNumber}`}
                className="btn-outline"
              >
                Cek Status Servis
              </Link>
            ) : null}
            <PrintButton />
          </div>
        </div>

        <div className="print-sheet overflow-hidden rounded-3xl border border-ink-900/10 bg-white shadow-soft">
          <div className="h-2 bg-brass-500" />
          <div className="p-6 sm:p-10">
            <div className="flex flex-wrap items-start justify-between gap-5">
              <div className="flex items-center gap-3">
                <BrandMark />
                <div>
                  <p className="font-display text-2xl font-bold text-ink-950">
                    {settings.businessName}
                  </p>
                  <p className="text-xs text-ink-500">{settings.tagline}</p>
                </div>
              </div>
              <div className="text-left sm:text-right">
                <p className="text-[0.65rem] font-bold uppercase tracking-[0.2em] text-ink-500">
                  Invoice
                </p>
                <p className="font-mono text-lg font-bold text-ink-950">
                  {invoice.invoiceNumber}
                </p>
                <div className="mt-1 flex sm:justify-end">
                  <StatusBadge
                    status={invoice.status}
                    className="normal-case tracking-normal"
                  />
                </div>
              </div>
            </div>

            <div className="mt-8 grid gap-6 border-t border-ink-900/10 pt-6 sm:grid-cols-2">
              <div>
                <p className="text-[0.65rem] font-bold uppercase tracking-wider text-ink-500">
                  Ditagihkan kepada
                </p>
                <p className="mt-1.5 font-semibold text-ink-950">
                  {invoice.customer.name}
                </p>
                <p className="mt-0.5 text-sm text-ink-600">
                  {invoice.customer.whatsapp}
                </p>
                {invoice.customer.email ? (
                  <p className="text-sm text-ink-600">{invoice.customer.email}</p>
                ) : null}
                {invoice.customer.address ? (
                  <p className="mt-1 max-w-xs text-sm leading-relaxed text-ink-600">
                    {invoice.customer.address}
                  </p>
                ) : null}
              </div>
              <div className="sm:text-right">
                <div className="space-y-1 text-sm">
                  <p className="text-ink-600">
                    Tanggal terbit{" "}
                    <span className="font-medium text-ink-900">
                      {formatDate(invoice.issuedAt)}
                    </span>
                  </p>
                  {invoice.dueAt ? (
                    <p className="text-ink-600">
                      Jatuh tempo{" "}
                      <span className="font-medium text-ink-900">
                        {formatDate(invoice.dueAt)}
                      </span>
                    </p>
                  ) : null}
                  {invoice.serviceOrder ? (
                    <p className="text-ink-600">
                      No. servis{" "}
                      <span className="font-mono font-medium text-ink-900">
                        {invoice.serviceOrder.orderNumber}
                      </span>
                    </p>
                  ) : null}
                  {invoice.sale ? (
                    <p className="text-ink-600">
                      No. transaksi{" "}
                      <span className="font-mono font-medium text-ink-900">
                        {invoice.sale.saleNumber}
                      </span>
                    </p>
                  ) : null}
                </div>
              </div>
            </div>

            {invoice.serviceOrder ? (
              <div className="mt-6 rounded-xl bg-[#faf7f1] p-4">
                <p className="text-xs font-semibold text-ink-800">
                  {invoice.serviceOrder.instrumentType}{" "}
                  {invoice.serviceOrder.brand} {invoice.serviceOrder.model}
                </p>
                <p className="mt-0.5 text-xs leading-relaxed text-ink-600">
                  {invoice.serviceOrder.complaint}
                </p>
                {invoice.serviceOrder.technician ? (
                  <p className="mt-1 text-xs text-ink-500">
                    Teknisi: {invoice.serviceOrder.technician.user.name}
                  </p>
                ) : null}
              </div>
            ) : null}

            <div className="mt-6 overflow-x-auto">
              <table className="w-full min-w-[480px] text-left text-sm">
                <thead>
                  <tr className="border-b border-ink-900/10 text-[0.65rem] uppercase tracking-wider text-ink-500">
                    <th className="py-2 pr-3 font-semibold">Deskripsi</th>
                    <th className="px-3 py-2 text-right font-semibold">Qty</th>
                    <th className="px-3 py-2 text-right font-semibold">Harga</th>
                    <th className="py-2 pl-3 text-right font-semibold">Jumlah</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item) => (
                    <tr key={item.id} className="border-b border-ink-900/5">
                      <td className="py-3 pr-3 text-ink-800">
                        {item.description}
                      </td>
                      <td className="px-3 py-3 text-right text-ink-600">
                        {item.qty}
                      </td>
                      <td className="px-3 py-3 text-right text-ink-600">
                        {formatIDR(item.unitPrice)}
                      </td>
                      <td className="py-3 pl-3 text-right font-medium text-ink-900">
                        {formatIDR(item.subtotal)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-6 ml-auto max-w-xs space-y-2 text-sm">
              <div className="flex justify-between text-ink-600">
                <span>Subtotal</span>
                <span className="font-medium text-ink-900">
                  {formatIDR(subtotal)}
                </span>
              </div>
              {toNumber(discount) > 0 ? (
                <div className="flex justify-between text-ink-600">
                  <span>Diskon</span>
                  <span className="font-medium text-emerald-700">
                    -{formatIDR(discount)}
                  </span>
                </div>
              ) : null}
              <div className="flex items-center justify-between border-t border-ink-900/10 pt-2">
                <span className="font-semibold text-ink-900">Total</span>
                <span className="font-display text-xl font-bold text-ink-950">
                  {formatIDR(total)}
                </span>
              </div>
              <div className="flex justify-between text-ink-600">
                <span>Dibayar</span>
                <span className="font-medium text-ink-900">
                  {formatIDR(paid)}
                </span>
              </div>
              <div className="flex items-center justify-between rounded-lg bg-[#faf7f1] px-3 py-2">
                <span className="font-semibold text-ink-800">
                  {isPaid ? "Lunas" : "Sisa tagihan"}
                </span>
                <span
                  className={
                    isPaid
                      ? "font-display text-lg font-bold text-emerald-700"
                      : "font-display text-lg font-bold text-rose-700"
                  }
                >
                  {isPaid ? formatIDR(0) : formatIDR(due)}
                </span>
              </div>
            </div>

            {payments.length ? (
              <div className="mt-6 border-t border-ink-900/10 pt-4">
                <p className="text-[0.65rem] font-bold uppercase tracking-wider text-ink-500">
                  Riwayat pembayaran
                </p>
                <ul className="mt-2 space-y-1.5 text-xs">
                  {payments.map((payment) => (
                    <li
                      key={payment.id}
                      className="flex flex-wrap justify-between gap-2 text-ink-600"
                    >
                      <span>
                        {formatDate(payment.paidAt)} &middot;{" "}
                        {payment.method}{" "}
                        {payment.type === "REFUND" ? "(refund)" : ""}
                      </span>
                      <span className="font-medium text-ink-900">
                        {formatIDR(payment.amount)}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            <div className="mt-8 border-t border-ink-900/10 pt-5 text-xs leading-relaxed text-ink-500">
              <p>{settings.invoiceFooter}</p>
              <p className="mt-2">
                {settings.address} &middot; {settings.phone} &middot;{" "}
                {settings.email}
              </p>
              <p className="mt-1">
                Invoice ini dibuat secara digital. Simpan tautan ini untuk
                keperluan Anda.
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
