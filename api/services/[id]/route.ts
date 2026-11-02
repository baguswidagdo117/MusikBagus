import { prisma } from "@/lib/db";
import { fail, handleError, ok, requireApi } from "@/lib/api";
import { serviceSchema } from "@/lib/validators";
import { audit } from "@/lib/audit";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, { params }: Ctx) {
  try {
    const guard = await requireApi("SERVICE_UPDATE");
    if (guard.error) return guard.error;
    const { id } = await params;
    const data = serviceSchema.partial().parse(await req.json());
    const service = await prisma.service.update({ where: { id }, data });
    await audit({
      userId: guard.user.id,
      action: "SERVICE_UPDATE",
      entity: "Service",
      entityId: id,
    });
    return ok(service);
  } catch (err) {
    return handleError(err);
  }
}

export async function DELETE(_req: Request, { params }: Ctx) {
  try {
    const guard = await requireApi("SERVICE_UPDATE");
    if (guard.error) return guard.error;
    const { id } = await params;
    const used = await prisma.service.findUnique({
      where: { id },
      include: { _count: { select: { bookings: true, serviceItems: true, saleItems: true } } },
    });
    if (!used) return fail("Layanan tidak ditemukan.", 404);
    if (used._count.bookings || used._count.serviceItems || used._count.saleItems) {
      const service = await prisma.service.update({
        where: { id },
        data: { active: false },
      });
      return ok({
        ...service,
        note: "Layanan dinonaktifkan karena sudah dipakai pada transaksi.",
      });
    }
    await prisma.service.delete({ where: { id } });
    return ok({ deleted: true });
  } catch (err) {
    return handleError(err);
  }
}
