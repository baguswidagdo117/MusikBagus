import { prisma } from "@/lib/db";
import { fail, handleError, ok, requireApi } from "@/lib/api";
import { customerSchema } from "@/lib/validators";
import { audit } from "@/lib/audit";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: Ctx) {
  const guard = await requireApi("CUSTOMER_VIEW");
  if (guard.error) return guard.error;
  const { id } = await params;
  const customer = await prisma.customer.findUnique({
    where: { id },
    include: {
      bookings: { orderBy: { createdAt: "desc" } },
      serviceOrders: { orderBy: { createdAt: "desc" } },
      sales: { orderBy: { createdAt: "desc" }, include: { invoice: true } },
    },
  });
  if (!customer) return fail("Pelanggan tidak ditemukan.", 404);
  return ok(customer);
}

export async function PATCH(req: Request, { params }: Ctx) {
  try {
    const guard = await requireApi("CUSTOMER_UPDATE");
    if (guard.error) return guard.error;
    const { id } = await params;
    const data = customerSchema.partial().parse(await req.json());
    const customer = await prisma.customer.update({
      where: { id },
      data: {
        ...data,
        ...(data.email !== undefined ? { email: data.email || null } : {}),
        ...(data.address !== undefined ? { address: data.address || null } : {}),
        ...(data.notes !== undefined ? { notes: data.notes || null } : {}),
      },
    });
    await audit({
      userId: guard.user.id,
      action: "CUSTOMER_UPDATE",
      entity: "Customer",
      entityId: id,
    });
    return ok(customer);
  } catch (err) {
    return handleError(err);
  }
}

export async function DELETE(_req: Request, { params }: Ctx) {
  try {
    const guard = await requireApi("CUSTOMER_UPDATE");
    if (guard.error) return guard.error;
    const { id } = await params;
    const counts = await prisma.customer.findUnique({
      where: { id },
      include: {
        _count: { select: { bookings: true, serviceOrders: true, sales: true } },
      },
    });
    if (!counts) return fail("Pelanggan tidak ditemukan.", 404);
    if (
      counts._count.bookings ||
      counts._count.serviceOrders ||
      counts._count.sales
    ) {
      return fail(
        "Pelanggan memiliki riwayat transaksi dan tidak dapat dihapus.",
        409,
      );
    }
    await prisma.customer.delete({ where: { id } });
    await audit({
      userId: guard.user.id,
      action: "CUSTOMER_DELETE",
      entity: "Customer",
      entityId: id,
    });
    return ok({ deleted: true });
  } catch (err) {
    return handleError(err);
  }
}
