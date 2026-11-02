import "server-only";
import { prisma } from "./db";
import { BusinessError, syncBookingFromOrder } from "./bookings";
import { SERVICE_ORDER_TRANSITIONS } from "./status";
import { audit } from "./audit";
import type { SessionUser } from "./session";

export type PaymentInput = {
  saleId?: string | null;
  serviceOrderId?: string | null;
  bookingId?: string | null;
  customerId?: string | null;
  amount: number;
  method: "CASH" | "TRANSFER" | "QRIS" | "EWALLET";
  type: "DP" | "PELUNASAN" | "REFUND";
  reference?: string | null;
};

export async function recordPayment(input: PaymentInput, user: SessionUser) {
  if (input.saleId) {
    return recordSalePayment(input, user);
  }
  return recordStandalonePayment(input, user);
}

async function recordSalePayment(input: PaymentInput, user: SessionUser) {
  const sale = await prisma.sale.findUnique({
    where: { id: input.saleId! },
    include: { invoice: true, serviceOrder: true },
  });
  if (!sale) throw new BusinessError("Transaksi tidak ditemukan.", 404);
  if (sale.paymentStatus === "PAID" && input.type !== "REFUND") {
    throw new BusinessError("Transaksi sudah lunas.", 422);
  }

  const payment = await prisma.$transaction(async (tx) => {
    const created = await tx.payment.create({
      data: {
        saleId: sale.id,
        customerId: sale.customerId,
        serviceOrderId: sale.serviceOrderId,
        amount: input.amount,
        method: input.method,
        type: input.type,
        reference: input.reference || null,
        cashierId: user.id,
      },
    });

    const total = Number(sale.total);
    const paid =
      input.type === "REFUND"
        ? Math.max(0, Number(sale.paid) - input.amount)
        : Math.min(total, Number(sale.paid) + input.amount);

    const status =
      input.type === "REFUND"
        ? "REFUND"
        : paid >= total
          ? "PAID"
          : paid > 0
            ? "PARTIAL"
            : "UNPAID";

    await tx.sale.update({
      where: { id: sale.id },
      data: { paid, paymentStatus: status },
    });

    if (sale.invoice) {
      await tx.invoice.update({
        where: { id: sale.invoice.id },
        data: { status: status === "PAID" ? "PAID" : "UNPAID" },
      });
    }

    return created;
  });

  if (sale.serviceOrderId && input.type !== "REFUND") {
    const updated = await prisma.sale.findUnique({ where: { id: sale.id } });
    if (Number(updated?.paid) >= Number(updated?.total)) {
      const order = await prisma.serviceOrder.findUnique({
        where: { id: sale.serviceOrderId },
      });
      if (order) {
        const allowed = SERVICE_ORDER_TRANSITIONS[order.status] ?? [];
        if (allowed.includes("PAID")) {
          await prisma.serviceOrder.update({
            where: { id: order.id },
            data: { status: "PAID" },
          });
        }
        if (order.bookingId) await syncBookingFromOrder(order.bookingId, "PAID");
      }
    }
  }

  await audit({
    userId: user.id,
    action: "PAYMENT_CREATE",
    entity: "Sale",
    entityId: sale.id,
    meta: {
      amount: input.amount,
      method: input.method,
      type: input.type,
    },
  });

  return payment;
}

async function recordStandalonePayment(input: PaymentInput, user: SessionUser) {
  if (!input.serviceOrderId && !input.bookingId) {
    throw new BusinessError("Pembayaran harus dikaitkan ke transaksi.", 422);
  }

  const payment = await prisma.payment.create({
    data: {
      serviceOrderId: input.serviceOrderId || null,
      bookingId: input.bookingId || null,
      customerId: input.customerId || null,
      amount: input.amount,
      method: input.method,
      type: input.type,
      reference: input.reference || null,
      cashierId: user.id,
    },
  });

  if (input.serviceOrderId) {
    const order = await prisma.serviceOrder.findUnique({
      where: { id: input.serviceOrderId },
      include: { invoice: true, payments: true },
    });
    if (order) {
      const paid = order.payments.reduce(
        (sum, p) => sum + (p.type === "REFUND" ? -Number(p.amount) : Number(p.amount)),
        0,
      );
      if (order.invoice && paid >= Number(order.invoice.total)) {
        await prisma.invoice.update({
          where: { id: order.invoice.id },
          data: { status: "PAID" },
        });
        const allowed = SERVICE_ORDER_TRANSITIONS[order.status] ?? [];
        if (allowed.includes("PAID")) {
          await prisma.serviceOrder.update({
            where: { id: order.id },
            data: { status: "PAID" },
          });
        }
        if (order.bookingId) await syncBookingFromOrder(order.bookingId, "PAID");
      }
    }
  }

  if (input.bookingId) {
    const booking = await prisma.booking.findUnique({
      where: { id: input.bookingId },
      include: { payments: true },
    });
    if (booking) {
      const paid = booking.payments.reduce(
        (sum, p) => sum + (p.type === "REFUND" ? -Number(p.amount) : Number(p.amount)),
        0,
      );
      if (paid > 0 && ["MENUNGGU_PEMBAYARAN", "DIKONFIRMASI", "MENUNGGU"].includes(booking.status)) {
        await prisma.booking.update({
          where: { id: booking.id },
          data: { status: "DP_DIBAYAR" },
        });
      }
    }
  }

  await audit({
    userId: user.id,
    action: "PAYMENT_CREATE",
    entity: input.serviceOrderId ? "ServiceOrder" : "Booking",
    entityId: input.serviceOrderId || input.bookingId,
    meta: { amount: input.amount, method: input.method, type: input.type },
  });

  return payment;
}
