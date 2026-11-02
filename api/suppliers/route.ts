import { prisma } from "@/lib/db";
import { handleError, ok, requireApi } from "@/lib/api";
import { supplierSchema } from "@/lib/validators";
import { audit } from "@/lib/audit";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const guard = await requireApi("SUPPLIER_VIEW");
    if (guard.error) return guard.error;
    const url = new URL(req.url);
    const q = url.searchParams.get("q")?.trim() ?? "";
    const items = await prisma.supplier.findMany({
      where: q
        ? {
            OR: [
              { name: { contains: q } },
              { contact: { contains: q } },
              { phone: { contains: q } },
            ],
          }
        : {},
      include: { _count: { select: { inventory: true } } },
      orderBy: { name: "asc" },
    });
    return ok(items);
  } catch (err) {
    return handleError(err);
  }
}

export async function POST(req: Request) {
  try {
    const guard = await requireApi("SUPPLIER_MANAGE");
    if (guard.error) return guard.error;
    const data = supplierSchema.parse(await req.json());
    const supplier = await prisma.supplier.create({ data });
    await audit({
      userId: guard.user.id,
      action: "SUPPLIER_CREATE",
      entity: "Supplier",
      entityId: supplier.id,
    });
    return ok(supplier, { status: 201 });
  } catch (err) {
    return handleError(err);
  }
}
