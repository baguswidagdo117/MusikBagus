import { fail, handleError, ok, requireApi } from "@/lib/api";
import { changeBookingStatus } from "@/lib/bookings";

type Ctx = { params: Promise<{ id: string }> };

export async function POST(_req: Request, { params }: Ctx) {
  try {
    const guard = await requireApi("BOOKING_CANCEL");
    if (guard.error) return guard.error;
    const { id } = await params;
    const result = await changeBookingStatus(id, "DIBATALKAN", guard.user);
    return ok(result);
  } catch (err) {
    if (err && typeof err === "object" && "status" in err) {
      const e = err as { message: string; status: number };
      return fail(e.message, e.status);
    }
    return handleError(err);
  }
}
