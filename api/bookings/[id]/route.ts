import { prisma } from "@/lib/db";
import { fail, handleError, ok, requireApi } from "@/lib/api";
import { bookingUpdateSchema } from "@/lib/validators";
import { changeBookingStatus } from "@/lib/bookings";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: Ctx) {
  const guard = await requireApi("BOOKING_VIEW");
  if (guard.error) return guard.error;
  const { id } = await params;
  const booking = await prisma.booking.findUnique({
    where: { id },
    include: {
      customer: true,
      service: true,
      payments: { orderBy: { paidAt: "desc" } },
      serviceOrder: {
        include: {
          technician: { include: { user: true } },
          items: true,
        },
      },
    },
  });
  if (!booking) return fail("Booking tidak ditemukan.", 404);
  return ok(booking);
}

export async function PATCH(req: Request, { params }: Ctx) {
  try {
    const guard = await requireApi("BOOKING_UPDATE");
    if (guard.error) return guard.error;
    const { id } = await params;
    const data = bookingUpdateSchema.parse(await req.json());
    const result = await changeBookingStatus(id, data.status, guard.user, {
      technicianId: data.technicianId || null,
      note: data.note || null,
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
