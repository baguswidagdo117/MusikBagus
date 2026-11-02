import "server-only";
import { prisma } from "./db";
import { BOOKING_TRANSITIONS, ORDER_TO_BOOKING_STATUS } from "./status";
import { nextServiceOrderNumber } from "./numbering";
import { audit } from "./audit";
import type { SessionUser } from "./session";

export class BusinessError extends Error {
  status: number;
  constructor(message: string, status = 400) {
    super(message);
    this.status = status;
  }
}

export async function changeBookingStatus(
  bookingId: string,
  nextStatus: string,
  user: SessionUser,
  options: { technicianId?: string | null; note?: string | null } = {},
) {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: { serviceOrder: true, customer: true },
  });
  if (!booking) throw new BusinessError("Booking tidak ditemukan.", 404);

  const allowed = BOOKING_TRANSITIONS[booking.status] ?? [];
  if (!allowed.includes(nextStatus)) {
    throw new BusinessError(
      `Status tidak dapat diubah dari ${booking.status} ke ${nextStatus}.`,
      422,
    );
  }

  let serviceOrderId = booking.serviceOrder?.id;

  await prisma.$transaction(async (tx) => {
    await tx.booking.update({
      where: { id: bookingId },
      data: { status: nextStatus },
    });

    if (
      nextStatus === "ALAT_DITERIMA" &&
      !booking.serviceOrder &&
      booking.status !== "ALAT_DITERIMA"
    ) {
      const orderNumber = await nextServiceOrderNumber();
      const order = await tx.serviceOrder.create({
        data: {
          orderNumber,
          customerId: booking.customerId,
          bookingId: booking.id,
          instrumentType: booking.instrumentType,
          brand: booking.brand,
          model: booking.model,
          serialNumber: booking.serialNumber,
          complaint: booking.complaint,
          technicianId: options.technicianId || undefined,
          status: "RECEIVED",
        },
      });
      serviceOrderId = order.id;
    }

    if (booking.serviceOrder) {
      const mapped = ORDER_TO_BOOKING_STATUS[nextStatus];
      if (!mapped) {
        await tx.serviceOrder.update({
          where: { id: booking.serviceOrder.id },
          data: {
            ...(options.technicianId
              ? { technicianId: options.technicianId }
              : {}),
          },
        });
      }
    }

    await tx.auditLog.create({
      data: {
        userId: user.id,
        action: "BOOKING_STATUS_CHANGE",
        entity: "Booking",
        entityId: bookingId,
        meta: JSON.stringify({
          from: booking.status,
          to: nextStatus,
          note: options.note ?? null,
        }),
      },
    });
  });

  return { ok: true, serviceOrderId, status: nextStatus };
}

export async function syncBookingFromOrder(
  bookingId: string,
  orderStatus: string,
) {
  const mapped = ORDER_TO_BOOKING_STATUS[orderStatus];
  if (!mapped) return;
  try {
    await prisma.booking.update({
      where: { id: bookingId },
      data: { status: mapped },
    });
  } catch {
    // booking mungkin sudah dihapus / tidak terkait
  }
}

export function assertTransition(
  current: string,
  next: string,
  transitions: Record<string, string[]>,
) {
  const allowed = transitions[current] ?? [];
  if (!allowed.includes(next)) {
    throw new BusinessError(
      `Transisi status ${current} → ${next} tidak diizinkan.`,
      422,
    );
  }
}
