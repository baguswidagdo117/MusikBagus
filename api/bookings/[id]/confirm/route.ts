import { fail, handleError, ok, requireApi } from "@/lib/api";
import { changeBookingStatus } from "@/lib/bookings";

type Ctx = { params: Promise<{ id: string }> };

export async function POST(req: Request, { params }: Ctx) {
  try {
    const guard = await requireApi("BOOKING_UPDATE");
    if (guard.error) return guard.error;
    const { id } = await params;
    let technicianId: string | null = null;
    try {
      const body = await req.json();
      technicianId = body?.technicianId || null;
    } catch {
      technicianId = null;
    }
    const result = await changeBookingStatus(id, "DIKONFIRMASI", guard.user, {
      technicianId,
    });
    return ok(result);
  } catch (err) {
    if (err && typeof err === "object" && "status" in err) {
      const e = err as { message: string; status: number };
      return fail(e.message, e.status);
    }
    return handleError(err);
  }
}
