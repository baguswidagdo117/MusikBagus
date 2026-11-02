import { prisma } from "@/lib/db";
import { fail, getPagination, handleError, ok, requireApi } from "@/lib/api";
import { inventorySchema } from "@/lib/validators";
import { audit } from "@/lib/audit";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const guard = await requireApi("INVENTORY_VIEW");
    if (guard.error) return guard.error;
    const url = new URL(req.url);
    const q = url.searchParams.get("q")?.trim() ?? "";
    const category = url.searchParams.get("category") ?? "";
    const low = url.searchParams.get("low") === "1";
    const { page, perPage, skip, take } = getPagination(url);

    const where = {
      ...(category ? { category } : {}),
      ...(q
        ? {
            OR: [
              { name: { contains: q } },
              { sku: { contains: q } },
              { category: { contains: q } },
            ],
          }
        : {}),
    };

    if (low) {
      const all = await prisma.inventory.findMany({
        where,
        include: { supplier: true },
        orderBy: { stock: "asc" },
      });
      const filtered = all.filter((item) => item.stock <= item.minStock);
      return ok({
        items: filtered.slice(skip, skip + take),
        total: filtered.length,
        page,
        perPage,
      });
    }

    const [items, total] = await Promise.all([
      prisma.inventory.findMany({
        where,
        orderBy: { name: "asc" },
        skip,
        take,
        include: { supplier: true },
      }),
      prisma.inventory.count({ where }),
    ]);
    return ok({ items, total, page, perPage });
  } catch (err) {
    return handleError(err);
  }
}

export async function POST(req: Request) {
  try {
    const guard = await requireApi("INVENTORY_CREATE");
    if (guard.error) return guard.error;
    const data = inventorySchema.parse(await req.json());
    const item = await prisma.$transaction(async (tx) => {
      const created = await tx.inventory.create({
        data: {
          sku: data.sku,
          name: data.name,
          category: data.category,
          supplierId: data.supplierId || null,
          purchasePrice: data.purchasePrice,
          sellPrice: data.sellPrice,
          stock: data.stock ?? 0,
          minStock: data.minStock ?? 2,
          unit: data.unit || "pcs",
        },
      });
      if ((data.stock ?? 0) > 0) {
        await tx.inventoryTransaction.create({
          data: {
            inventoryId: created.id,
            type: "IN",
            qty: data.stock ?? 0,
            note: "Stok awal",
            refType: "MANUAL",
            userId: guard.user.id,
          },
        });
      }
      return created;
    });
    await audit({
      userId: guard.user.id,
      action: "INVENTORY_CREATE",
      entity: "Inventory",
      entityId: item.id,
      meta: { sku: item.sku },
    });
    return ok(item, { status: 201 });
  } catch (err) {
    return handleError(err);
  }
}
