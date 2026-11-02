import { prisma } from "@/lib/db";
import { fail, handleError, ok, requireApi } from "@/lib/api";
import { serviceOrderUpdateSchema } from "@/lib/validators";
import { SERVICE_ORDER_TRANSITIONS } from "@/lib/status";
import {
  BusinessError,
  assertTransition,
  syncBookingFromOrder,
} from "@/lib/bookings";
import { audit } from "@/lib/audit";
import { nextInvoiceNumber } from "@/lib/numbering";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

async function loadOrder(id: string) {
  return prisma.serviceOrder.findUnique({
    where: { id },
    include: {
      customer: true,
      items: { include: { service: true, inventory: true } },
      technician: { include: { user: true } },
      booking: true,
      invoice: true,
      payments: true,
      sales: { include: { payments: true } },
    },
  });
}

export async function GET(_req: Request, { params }: Ctx) {
  const guard = await requireApi("WORKORDER_VIEW");
  if (guard.error) return guard.error;
  const { id } = await params;
  const order = await loadOrder(id);
  if (!order) return fail("Work order tidak ditemukan.", 404);
  if (guard.user.role === "TEKNISI") {
    const tech = await prisma.technician.findUnique({
      where: { userId: guard.user.id },
      select: { id: true },
    });
    if (!tech || order.technicianId !== tech.id) {
      return fail("Anda tidak ditugaskan pada work order ini.", 403);
    }
  }
  return ok(order);
}

export async function PATCH(req: Request, { params }: Ctx) {
  try {
    const guard = await requireApi("WORKORDER_UPDATE");
    if (guard.error) return guard.error;
    const { id } = await params;
    const existing = await loadOrder(id);
    if (!existing) return fail("Work order tidak ditemukan.", 404);

    if (guard.user.role === "TEKNISI") {
      const tech = await prisma.technician.findUnique({
        where: { userId: guard.user.id },
        select: { id: true },
      });
      if (!tech || existing.technicianId !== tech.id) {
        return fail("Anda tidak ditugaskan pada work order ini.", 403);
      }
    }

    const data = serviceOrderUpdateSchema.parse(await req.json());

    if (data.status && data.status !== existing.status) {
      if (guard.user.role === "TEKNISI" && data.status === "CANCELLED") {
        return fail("Teknisi tidak boleh membatalkan work order.", 403);
      }
      assertTransition(existing.status, data.status, SERVICE_ORDER_TRANSITIONS);
    }

    const isTechnician = guard.user.role === "TEKNISI";
    const order = await prisma.serviceOrder.update({
      where: { id },
      data: {
        ...(data.instrumentType ? { instrumentType: data.instrumentType } : {}),
        ...(data.brand !== undefined ? { brand: data.brand || null } : {}),
        ...(data.model !== undefined ? { model: data.model || null } : {}),
        ...(data.serialNumber !== undefined
          ? { serialNumber: data.serialNumber || null }
          : {}),
        ...(data.initialCondition !== undefined
          ? { initialCondition: data.initialCondition || null }
          : {}),
        ...(data.complaint ? { complaint: data.complaint } : {}),
        ...(data.diagnosis !== undefined
          ? { diagnosis: data.diagnosis || null }
          : {}),
        ...(data.technicianNotes !== undefined
          ? { technicianNotes: data.technicianNotes || null }
          : {}),
        ...(data.beforePhoto !== undefined
          ? { beforePhoto: data.beforePhoto || null }
          : {}),
        ...(data.afterPhoto !== undefined
          ? { afterPhoto: data.afterPhoto || null }
          : {}),
        ...(data.estimatedDone !== undefined
          ? {
              estimatedDone: data.estimatedDone
                ? new Date(data.estimatedDone)
                : null,
            }
          : {}),
        ...(data.serviceFee !== undefined && !isTechnician
          ? { serviceFee: data.serviceFee }
          : {}),
        ...(data.estimateCost !== undefined && !isTechnician
          ? { estimateCost: data.estimateCost }
          : {}),
        ...(data.technicianId !== undefined && !isTechnician
          ? { technicianId: data.technicianId || null }
          : {}),
        ...(data.status ? { status: data.status } : {}),
      },
    });

    if (data.status && existing.bookingId) {
      await syncBookingFromOrder(existing.bookingId, data.status);
    }

    if (data.status === "COMPLETED" && !existing.invoice) {
      const total =
        Number(existing.serviceFee) +
        existing.items.reduce((sum, item) => sum + Number(item.subtotal), 0);
      if (total > 0) {
        const paid = [...existing.payments, ...existing.sales.flatMap((sale) => sale.payments)]
          .reduce(
            (sum, payment) =>
              sum +
              (payment.type === "REFUND"
                ? -Number(payment.amount)
                : Number(payment.amount)),
            0,
          );
        await prisma.invoice.create({
          data: {
            invoiceNumber: await nextInvoiceNumber(),
            serviceOrderId: existing.id,
            customerId: existing.customerId,
            total,
            status: paid >= total ? "PAID" : "UNPAID",
          },
        });
      }
    }

    await audit({
      userId: guard.user.id,
      action: data.status ? "WORKORDER_STATUS_CHANGE" : "WORKORDER_UPDATE",
      entity: "ServiceOrder",
      entityId: id,
      meta: data.status
        ? { from: existing.status, to: data.status }
        : { fields: Object.keys(data) },
    });

    return ok(order);
  } catch (err) {
    if (err instanceof BusinessError) return fail(err.message, err.status);
    return handleError(err);
  }
}
