import { prisma } from "@/lib/db";
import { fail, handleError, ok, requireApi } from "@/lib/api";
import { stockTxSchema } from "@/lib/validators";
import { applyStockChange } from "@/lib/inventory";
import { BusinessError } from "@/lib/bookings";
import { audit } from "@/lib/audit";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

export async function POST(req: Request, { params }: Ctx) {
  try {
    const { id } = await params;
    const body = await req.json();
    const data = stockTxSchema.parse(body);
    const permission =
      data.type === "OUT" ? "INVENTORY_STOCK_OUT" : "INVENTORY_STOCK_IN";
    const guard = await requireApi(permission);
    if (guard.error) return guard.error;

    const item = await prisma.$transaction(async (tx) => {
      const delta =
        data.type === "OUT"
          ? -data.qty
          : data.type === "IN"
            ? data.qty
            : data.qty;
      const result = await applyStockChange(tx, {
        inventoryId: id,
        delta,
        type: data.type,
        note: data.note || null,
        refType: "MANUAL",
        userId: guard.user.id,
      });
      return result.item;
    });

    await audit({
      userId: guard.user.id,
      action: `STOCK_${data.type}`,
      entity: "Inventory",
      entityId: id,
      meta: { qty: data.qty, note: data.note },
    });

    return ok(item);
  } catch (err) {
    if (err instanceof BusinessError) return fail(err.message, err.status);
    return handleError(err);
  }
}
