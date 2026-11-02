import { prisma } from "@/lib/db";
import {
  fail,
  getPagination,
  handleError,
  ok,
  requireApi,
} from "@/lib/api";
import { publicBookingSchema } from "@/lib/validators";
import { nextBookingNumber, nextCustomerCode } from "@/lib/numbering";
import { rateLimit } from "@/lib/rate-limit";
import { audit } from "@/lib/audit";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const guard = await requireApi("BOOKING_VIEW");
    if (guard.error) return guard.error;
    const url = new URL(req.url);
    const q = url.searchParams.get("q")?.trim() ?? "";
    const status = url.searchParams.get("status") ?? "";
    const { page, perPage, skip, take } = getPagination(url);
    const where = {
      ...(status ? { status } : {}),
      ...(q
        ? {
            OR: [
              { bookingNumber: { contains: q } },
              { customer: { name: { contains: q } } },
              { customer: { whatsapp: { contains: q } } },
              { brand: { contains: q } },
            ],
          }
        : {}),
    };
    const [items, total] = await Promise.all([
      prisma.booking.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take,
        include: {
          customer: true,
          service: true,
          serviceOrder: { select: { id: true, orderNumber: true, status: true } },
        },
      }),
      prisma.booking.count({ where }),
    ]);
    return ok({ items, total, page, perPage });
  } catch (err) {
    return handleError(err);
  }
}

export async function POST(req: Request) {
  try {
    const ip = req.headers.get("x-forwarded-for") ?? "local";
    const limit = rateLimit(`booking:${ip}`, 8, 10 * 60_000);
    if (!limit.ok) {
      return fail(
        "Terlalu banyak pengajuan booking. Silakan coba beberapa saat lagi.",
        429,
      );
    }

    const data = publicBookingSchema.parse(await req.json());
    const when = new Date(`${data.date}T${data.time}:00`);
    if (Number.isNaN(when.getTime())) return fail("Tanggal/jam tidak valid.", 422);
    if (when.getTime() < Date.now() - 60 * 60 * 1000) {
      return fail("Tanggal booking tidak boleh di masa lalu.", 422);
    }

    let customer = await prisma.customer.findFirst({
      where: { whatsapp: data.whatsapp },
    });
    if (!customer) {
      customer = await prisma.customer.create({
        data: {
          code: await nextCustomerCode(),
          name: data.name,
          whatsapp: data.whatsapp,
          email: data.email || null,
        },
      });
    }

    const booking = await prisma.booking.create({
      data: {
        bookingNumber: await nextBookingNumber(),
        customerId: customer.id,
        instrumentType: data.instrumentType,
        brand: data.brand || null,
        model: data.model || null,
        serialNumber: data.serialNumber || null,
        complaint: data.complaint,
        serviceId: data.serviceId || null,
        date: new Date(`${data.date}T00:00:00`),
        time: data.time,
        notes: data.notes || null,
        photoUrl: data.photoUrl || null,
        source: data.source || "web",
      },
      include: { customer: true },
    });

    const staff = await prisma.user.findMany({
      where: { role: { in: ["OWNER", "ADMIN"] }, active: true },
      select: { id: true },
    });
    if (staff.length) {
      await prisma.notification.createMany({
        data: staff.map((s) => ({
          userId: s.id,
          title: "Booking baru masuk",
          message: `${customer.name} - ${data.instrumentType} (${booking.bookingNumber})`,
          link: `/admin/bookings/${booking.id}`,
        })),
      });
    }

    await audit({
      action: "BOOKING_CREATE_PUBLIC",
      entity: "Booking",
      entityId: booking.id,
      meta: { bookingNumber: booking.bookingNumber, source: data.source },
      ip,
    });

    return ok(
      {
        bookingNumber: booking.bookingNumber,
        id: booking.id,
        status: booking.status,
        date: booking.date,
        time: booking.time,
        customerName: customer.name,
      },
      { status: 201 },
    );
  } catch (err) {
    return handleError(err);
  }
}
