import { prisma } from "@/lib/db";
import { handleError, ok, requireApi, fail, getPagination } from "@/lib/api";
import { nextCustomerCode } from "@/lib/numbering";
import { customerSchema } from "@/lib/validators";
import { audit } from "@/lib/audit";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const guard = await requireApi("CUSTOMER_VIEW");
    if (guard.error) return guard.error;

    const url = new URL(req.url);
    const q = url.searchParams.get("q")?.trim() ?? "";
    const { page, perPage, skip, take } = getPagination(url);
    const where = q
      ? {
          OR: [
            { name: { contains: q } },
            { whatsapp: { contains: q } },
            { code: { contains: q } },
            { email: { contains: q } },
          ],
        }
      : {};
    const [items, total] = await Promise.all([
      prisma.customer.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take,
        include: {
          _count: { select: { bookings: true, serviceOrders: true, sales: true } },
        },
      }),
      prisma.customer.count({ where }),
    ]);
    return ok({ items, total, page, perPage });
  } catch (err) {
    return handleError(err);
  }
}

export async function POST(req: Request) {
  try {
    const guard = await requireApi("CUSTOMER_CREATE");
    if (guard.error) return guard.error;
    const data = customerSchema.parse(await req.json());
    const existing = await prisma.customer.findFirst({
      where: { whatsapp: data.whatsapp },
    });
    if (existing) return fail("Nomor WhatsApp sudah terdaftar.", 409);
    const customer = await prisma.customer.create({
      data: {
        ...data,
        email: data.email || null,
        address: data.address || null,
        notes: data.notes || null,
        code: await nextCustomerCode(),
      },
    });
    await audit({
      userId: guard.user.id,
      action: "CUSTOMER_CREATE",
      entity: "Customer",
      entityId: customer.id,
      meta: { name: customer.name },
    });
    return ok(customer, { status: 201 });
  } catch (err) {
    return handleError(err);
  }
}
