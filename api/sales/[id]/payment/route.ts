import { fail, handleError, ok, requireApi } from "@/lib/api";
import { paymentSchema } from "@/lib/validators";
import { recordPayment } from "@/lib/payments";
import { BusinessError } from "@/lib/bookings";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

export async function POST(req: Request, { params }: Ctx) {
  try {
    const guard = await requireApi("POS_PAYMENT");
    if (guard.error) return guard.error;
    const { id } = await params;
    const body = await req.json();
    const data = paymentSchema.parse({ ...body, saleId: id });
    const payment = await recordPayment(
      {
        saleId: id,
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
