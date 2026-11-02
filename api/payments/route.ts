import { prisma } from "@/lib/db";
import { fail, getPagination, handleError, ok, requireApi } from "@/lib/api";
import { paymentSchema } from "@/lib/validators";
import { recordPayment } from "@/lib/payments";
import { BusinessError } from "@/lib/bookings";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const guard = await requireApi("POS_VIEW");
    if (guard.error) return guard.error;
    const url = new URL(req.url);
    const { page, perPage, skip, take } = getPagination(url);
    const [items, total] = await Promise.all([
      prisma.payment.findMany({
        orderBy: { paidAt: "desc" },
        skip,
        take,
        include: {
          customer: true,
          sale: { select: { saleNumber: true } },
          serviceOrder: { select: { orderNumber: true } },
        },
      }),
      prisma.payment.count(),
    ]);
    return ok({ items, total, page, perPage });
  } catch (err) {
    return handleError(err);
  }
}

export async function POST(req: Request) {
  try {
    const guard = await requireApi("POS_PAYMENT");
    if (guard.error) return guard.error;
    const data = paymentSchema.parse(await req.json());
    const payment = await recordPayment(
      {
        saleId: data.saleId || null,
        serviceOrderId: data.serviceOrderId || null,
        bookingId: data.bookingId || null,
        customerId: data.customerId || null,
        amount: data.amount,
        method: data.method,
        type: data.type,
        reference: data.reference || null,
      },
      guard.user,
    );
    return ok(payment, { status: 201 });
  } catch (err) {
    if (err instanceof BusinessError) return fail(err.message, err.status);
    return handleError(err);
  }
}
