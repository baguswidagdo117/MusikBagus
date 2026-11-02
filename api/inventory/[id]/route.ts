import { prisma } from "@/lib/db";
import { fail, handleError, ok, requireApi } from "@/lib/api";
import { inventorySchema } from "@/lib/validators";
import { audit } from "@/lib/audit";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: Ctx) {
  const guard = await requireApi("INVENTORY_VIEW");
  if (guard.error) return guard.error;
  const { id } = await params;
  const item = await prisma.inventory.findUnique({
    where: { id },
    include: {
      supplier: true,
      txns: {
        orderBy: { createdAt: "desc" },
        take: 50,
        include: { user: { select: { name: true } } },
      },
    },
  });
  if (!item) return fail("Barang tidak ditemukan.", 404);
  return ok(item);
}

export async function PATCH(req: Request, { params }: Ctx) {
  try {
    const guard = await requireApi("INVENTORY_UPDATE");
    if (guard.error) return guard.error;
    const { id } = await params;
    const data = inventorySchema.partial().parse(await req.json());
    const item = await prisma.inventory.update({
      where: { id },
      data: {
        ...data,
        ...(data.supplierId !== undefined
          ? { supplierId: data.supplierId || null }
          : {}),
      },
    });
    await audit({
      userId: guard.user.id,
      action: "INVENTORY_UPDATE",
      entity: "Inventory",
      entityId: id,
    });
    return ok(item);
  } catch (err) {
    return handleError(err);
  }
}

export async function DELETE(_req: Request, { params }: Ctx) {
  try {
    const guard = await requireApi("INVENTORY_UPDATE");
    if (guard.error) return guard.error;
    const { id } = await params;
    const used = await prisma.inventory.findUnique({
      where: { id },
      include: {
        _count: { select: { serviceItems: true, saleItems: true, txns: true } },
      },
    });
    if (!used) return fail("Barang tidak ditemukan.", 404);
    if (used._count.serviceItems || used._count.saleItems) {
      const item = await prisma.inventory.update({
        where: { id },
        data: { active: false },
      });
      return ok({ ...item, note: "Barang dinonaktifkan karena sudah dipakai." });
    }
    await prisma.inventory.delete({ where: { id } });
    return ok({ deleted: true });
  } catch (err) {
    return handleError(err);
  }
}
