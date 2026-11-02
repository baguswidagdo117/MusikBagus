import { prisma } from "@/lib/db";
import { fail, handleError, ok, requireApi } from "@/lib/api";
import { serviceItemSchema } from "@/lib/validators";
import { applyStockChange } from "@/lib/inventory";
import { BusinessError } from "@/lib/bookings";
import { audit } from "@/lib/audit";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

export async function POST(req: Request, { params }: Ctx) {
  try {
    const guard = await requireApi("WORKORDER_UPDATE");
    if (guard.error) return guard.error;
    const { id } = await params;
    const data = serviceItemSchema.parse(await req.json());

    const order = await prisma.serviceOrder.findUnique({
      where: { id },
      include: { items: true },
    });
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

    let description = data.description || "";
    let unitPrice = data.unitPrice ?? 0;

    if (data.type === "PART") {
      if (!data.inventoryId) return fail("Spare part wajib dipilih.", 422);
      const inv = await prisma.inventory.findUnique({
        where: { id: data.inventoryId },
      });
      if (!inv) return fail("Spare part tidak ditemukan.", 404);
      if (!description) description = inv.name;
      if (!unitPrice) unitPrice = Number(inv.sellPrice);
    }

    if (data.type === "JASA" && data.serviceId) {
      const svc = await prisma.service.findUnique({
        where: { id: data.serviceId },
      });
      if (svc) {
        if (!description) description = svc.name;
        if (!unitPrice) unitPrice = Number(svc.price);
      }
    }

    if (!description) return fail("Deskripsi item wajib diisi.", 422);

    const item = await prisma.$transaction(async (tx) => {
      if (data.type === "PART" && data.inventoryId) {
        await applyStockChange(tx, {
          inventoryId: data.inventoryId,
          delta: -data.qty,
          type: "OUT",
          note: `Pemakaian pada ${order.orderNumber}`,
          refType: "SERVICE_ORDER",
          refId: order.id,
          userId: guard.user.id,
        });
      }
      const created = await tx.serviceItem.create({
        data: {
          serviceOrderId: id,
          type: data.type,
          serviceId: data.serviceId || null,
          inventoryId: data.inventoryId || null,
          description,
          qty: data.qty,
          unitPrice,
          subtotal: unitPrice * data.qty,
        },
      });
      const items = await tx.serviceItem.findMany({
        where: { serviceOrderId: id },
      });
      const itemsTotal = items.reduce((sum, i) => sum + Number(i.subtotal), 0);
      await tx.serviceOrder.update({
        where: { id },
        data: { estimateCost: Number(order.serviceFee) + itemsTotal },
      });
      return created;
    });

    await audit({
      userId: guard.user.id,
      action: "WORKORDER_ITEM_ADD",
      entity: "ServiceItem",
      entityId: item.id,
      meta: { orderNumber: order.orderNumber, description: item.description },
    });

    return ok(item, { status: 201 });
  } catch (err) {
    if (err instanceof BusinessError) return fail(err.message, err.status);
    return handleError(err);
  }
}
