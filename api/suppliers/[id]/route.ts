import { prisma } from "@/lib/db";
import { fail, handleError, ok, requireApi } from "@/lib/api";
import { supplierSchema } from "@/lib/validators";
import { audit } from "@/lib/audit";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, { params }: Ctx) {
  try {
    const guard = await requireApi("SUPPLIER_MANAGE");
    if (guard.error) return guard.error;
    const { id } = await params;
    const data = supplierSchema.partial().parse(await req.json());
    const supplier = await prisma.supplier.update({ where: { id }, data });
    await audit({
      userId: guard.user.id,
      action: "SUPPLIER_UPDATE",
      entity: "Supplier",
      entityId: id,
    });
    return ok(supplier);
  } catch (err) {
    return handleError(err);
  }
}

export async function DELETE(_req: Request, { params }: Ctx) {
  try {
    const guard = await requireApi("SUPPLIER_MANAGE");
    if (guard.error) return guard.error;
    const { id } = await params;
    const used = await prisma.supplier.findUnique({
      where: { id },
      include: { _count: { select: { inventory: true } } },
    });
    if (!used) return fail("Supplier tidak ditemukan.", 404);
    if (used._count.inventory) {
      return fail("Supplier masih terhubung dengan barang inventaris.", 409);
    }
    await prisma.supplier.delete({ where: { id } });
    await audit({
      userId: guard.user.id,
      action: "SUPPLIER_DELETE",
      entity: "Supplier",
      entityId: id,
    });
    return ok({ deleted: true });
  } catch (err) {
    return handleError(err);
  }
}
