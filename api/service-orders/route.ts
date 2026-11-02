import { prisma } from "@/lib/db";
import { fail, getPagination, handleError, ok, requireApi } from "@/lib/api";
import { serviceOrderSchema } from "@/lib/validators";
import { nextServiceOrderNumber } from "@/lib/numbering";
import { audit } from "@/lib/audit";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const guard = await requireApi("WORKORDER_VIEW");
    if (guard.error) return guard.error;
    const url = new URL(req.url);
    const q = url.searchParams.get("q")?.trim() ?? "";
    const status = url.searchParams.get("status") ?? "";
    const mine = url.searchParams.get("mine") === "1";
    const { page, perPage, skip, take } = getPagination(url);

    let technicianId: string | undefined;
    if (guard.user.role === "TEKNISI" || mine) {
      const tech = await prisma.technician.findUnique({
        where: { userId: guard.user.id },
        select: { id: true },
      });
      if (!tech) return ok({ items: [], total: 0, page, perPage });
      technicianId = tech.id;
    }

    const where = {
      ...(status ? { status } : {}),
      ...(technicianId ? { technicianId } : {}),
      ...(q
        ? {
            OR: [
              { orderNumber: { contains: q } },
              { customer: { name: { contains: q } } },
              { brand: { contains: q } },
              { complaint: { contains: q } },
            ],
          }
        : {}),
    };
    const [items, total] = await Promise.all([
      prisma.serviceOrder.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take,
        include: {
          customer: true,
          technician: { include: { user: { select: { name: true } } } },
          booking: { select: { bookingNumber: true, status: true } },
          _count: { select: { items: true } },
          invoice: { select: { invoiceNumber: true, status: true, total: true } },
        },
      }),
      prisma.serviceOrder.count({ where }),
    ]);
    return ok({ items, total, page, perPage });
  } catch (err) {
    return handleError(err);
  }
}

export async function POST(req: Request) {
  try {
    const guard = await requireApi("WORKORDER_CREATE");
    if (guard.error) return guard.error;
    const data = serviceOrderSchema.parse(await req.json());

    let customerId = data.customerId;
    let booking = null;
    if (data.bookingId) {
      booking = await prisma.booking.findUnique({
        where: { id: data.bookingId },
        include: { serviceOrder: true },
      });
      if (!booking) return fail("Booking tidak ditemukan.", 404);
      if (booking.serviceOrder)
        return fail("Booking sudah memiliki Work Order.", 409);
      customerId = booking.customerId;
    }
    if (!customerId) return fail("Pelanggan wajib dipilih.", 422);

    const order = await prisma.serviceOrder.create({
      data: {
        orderNumber: await nextServiceOrderNumber(),
        customerId,
        bookingId: booking?.id ?? null,
        instrumentType: data.instrumentType,
        brand: data.brand || null,
        model: data.model || null,
        serialNumber: data.serialNumber || null,
        initialCondition: data.initialCondition || null,
        complaint: data.complaint,
        diagnosis: data.diagnosis || null,
        technicianId: data.technicianId || null,
        serviceFee: data.serviceFee ?? 0,
        estimateCost: data.estimateCost ?? 0,
        estimatedDone: data.estimatedDone
          ? new Date(data.estimatedDone)
          : null,
        status: data.status || "RECEIVED",
        technicianNotes: data.technicianNotes || null,
      },
      include: { customer: true },
    });

    if (booking) {
      await prisma.booking.update({
        where: { id: booking.id },
        data: { status: "ALAT_DITERIMA" },
      });
    }

    await audit({
      userId: guard.user.id,
      action: "WORKORDER_CREATE",
      entity: "ServiceOrder",
      entityId: order.id,
      meta: { orderNumber: order.orderNumber },
    });

    return ok(order, { status: 201 });
  } catch (err) {
    return handleError(err);
  }
}
