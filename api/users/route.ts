import { prisma } from "@/lib/db";
import { fail, handleError, ok, requireApi } from "@/lib/api";
import { userSchema } from "@/lib/validators";
import { hashPassword } from "@/lib/auth";
import { audit } from "@/lib/audit";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const guard = await requireApi("USER_MANAGE");
    if (guard.error) return guard.error;
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        phone: true,
        active: true,
        createdAt: true,
      },
      orderBy: { name: "asc" },
    });
    return ok(users);
  } catch (err) {
    return handleError(err);
  }
}

export async function POST(req: Request) {
  try {
    const guard = await requireApi("USER_MANAGE");
    if (guard.error) return guard.error;
    const data = userSchema.parse(await req.json());
    const exists = await prisma.user.findUnique({ where: { email: data.email } });
    if (exists) return fail("Email sudah terdaftar.", 409);
    const user = await prisma.user.create({
      data: {
        name: data.name,
        email: data.email.toLowerCase(),
        passwordHash: await hashPassword(data.password),
        role: data.role,
        phone: data.phone || null,
      },
      select: { id: true, name: true, email: true, role: true, active: true },
    });
    if (data.role === "TEKNISI") {
      await prisma.technician.create({ data: { userId: user.id } });
    }
    await audit({
      userId: guard.user.id,
      action: "USER_CREATE",
      entity: "User",
      entityId: user.id,
      meta: { role: data.role },
    });
    return ok(user, { status: 201 });
  } catch (err) {
    return handleError(err);
  }
}
