import { prisma } from "@/lib/db";
import { fail, handleError, ok, requireApi } from "@/lib/api";
import { nextInvoiceNumber } from "@/lib/numbering";
import { audit } from "@/lib/audit";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

export async function POST(_req: Request, { params }: Ctx) {
  try {
    const guard = await requireApi("POS_CREATE");
    if (guard.error) return guard.error;
    const { id } = await params;

    const order = await prisma.serviceOrder.findUnique({
      where: { id },
      include: { items: true, invoice: true, payments: true },
    });
    if (!order) return fail("Work order tidak ditemukan.", 404);
    if (order.invoice) return ok(order.invoice);

    const total =
      Number(order.serviceFee) +
      order.items.reduce((sum, item) => sum + Number(item.subtotal), 0);
    if (total <= 0) {
      return fail("Total work order masih nol. Tambahkan biaya terlebih dahulu.", 422);
    }

    const paid = order.payments.reduce(
      (sum, payment) =>
        sum +
        (payment.type === "REFUND"
          ? -Number(payment.amount)
          : Number(payment.amount)),
      0,
    );

    const invoice = await prisma.invoice.create({
      data: {
        invoiceNumber: await nextInvoiceNumber(),
        serviceOrderId: order.id,
        customerId: order.customerId,
        total,
        status: paid >= total ? "PAID" : "UNPAID",
      },
    });

    await audit({
      userId: guard.user.id,
      action: "INVOICE_CREATE",
      entity: "Invoice",
      entityId: invoice.id,
      meta: { invoiceNumber: invoice.invoiceNumber, orderNumber: order.orderNumber },
    });

    return ok(invoice, { status: 201 });
  } catch (err) {
    return handleError(err);
  }
}
