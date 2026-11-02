import { prisma } from "@/lib/db";
import { handleError, ok, requireApi } from "@/lib/api";
import { technicianSchema } from "@/lib/validators";
import { hashPassword } from "@/lib/auth";
import { audit } from "@/lib/audit";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const guard = await requireApi("WORKORDER_VIEW");
    if (guard.error) return guard.error;
    const technicians = await prisma.technician.findMany({
      where: { active: true },
      include: { user: { select: { name: true, email: true, phone: true } } },
      orderBy: { user: { name: "asc" } },
    });
    return ok(technicians);
  } catch (err) {
    return handleError(err);
  }
}

export async function POST(req: Request) {
  try {
    const guard = await requireApi("USER_MANAGE");
    if (guard.error) return guard.error;
    const data = technicianSchema.parse(await req.json());
    if (!data.password) {
      return handleError(new Error("Password wajib untuk teknisi baru."));
    }
    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          name: data.name,
          email: data.email.toLowerCase(),
          passwordHash: await hashPassword(data.password!),
          role: "TEKNISI",
          phone: data.phone || null,
        },
      });
      return tx.technician.create({
        data: {
          userId: user.id,
          specialization: data.specialization || null,
        },
        include: { user: true },
      });
    });
    await audit({
      userId: guard.user.id,
      action: "TECHNICIAN_CREATE",
      entity: "Technician",
      entityId: result.id,
    });
    return ok(result, { status: 201 });
  } catch (err) {
    return handleError(err);
  }
}
