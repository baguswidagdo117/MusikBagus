import { prisma } from "@/lib/db";
import { fail, handleError, ok, requireApi } from "@/lib/api";
import { applyStockChange } from "@/lib/inventory";
import { audit } from "@/lib/audit";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string; itemId: string }> };

export async function DELETE(_req: Request, { params }: Ctx) {
  try {
    const guard = await requireApi("WORKORDER_UPDATE");
    if (guard.error) return guard.error;
    const { id, itemId } = await params;
    const item = await prisma.serviceItem.findUnique({ where: { id: itemId } });
    if (!item || item.serviceOrderId !== id) {
      return fail("Item tidak ditemukan.", 404);
    }
    const order = await prisma.serviceOrder.findUnique({ where: { id } });
    if (!order) return fail("Work order tidak ditemukan.", 404);

    await prisma.$transaction(async (tx) => {
      if (item.type === "PART" && item.inventoryId) {
        await applyStockChange(tx, {
          inventoryId: item.inventoryId,
          delta: item.qty,
          type: "IN",
          note: `Pembatalan pemakaian pada ${order.orderNumber}`,
          refType: "SERVICE_ORDER",
          refId: order.id,
          userId: guard.user.id,
        });
      }
      await tx.serviceItem.delete({ where: { id: itemId } });
      const items = await tx.serviceItem.findMany({
        where: { serviceOrderId: id },
      });
      const itemsTotal = items.reduce((sum, i) => sum + Number(i.subtotal), 0);
      await tx.serviceOrder.update({
        where: { id },
        data: { estimateCost: Number(order.serviceFee) + itemsTotal },
      });
    });

    await audit({
      userId: guard.user.id,
      action: "WORKORDER_ITEM_DELETE",
      entity: "ServiceItem",
      entityId: itemId,
    });

    return ok({ deleted: true });
  } catch (err) {
    return handleError(err);
  }
}
