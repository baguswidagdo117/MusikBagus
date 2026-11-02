import { prisma } from "@/lib/db";
import { handleError, ok, requireApi } from "@/lib/api";
import { hashPassword } from "@/lib/auth";
import { audit } from "@/lib/audit";
import { z } from "zod";

export const dynamic = "force-dynamic";

const patchSchema = z.object({
  name: z.string().trim().min(2).max(120).optional(),
  role: z.enum(["OWNER", "ADMIN", "KASIR", "TEKNISI"]).optional(),
  active: z.boolean().optional(),
  password: z.string().min(6).max(100).optional().or(z.literal("")),
  phone: z.string().max(30).optional().or(z.literal("")),
});

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, { params }: Ctx) {
  try {
    const guard = await requireApi("USER_MANAGE");
    if (guard.error) return guard.error;
    const { id } = await params;
    const data = patchSchema.parse(await req.json());
    const user = await prisma.user.update({
      where: { id },
      data: {
        ...(data.name ? { name: data.name } : {}),
        ...(data.role ? { role: data.role } : {}),
        ...(typeof data.active === "boolean" ? { active: data.active } : {}),
        ...(data.phone !== undefined ? { phone: data.phone || null } : {}),
        ...(data.password
          ? { passwordHash: await hashPassword(data.password) }
          : {}),
      },
      select: { id: true, name: true, email: true, role: true, active: true },
    });
    await audit({
      userId: guard.user.id,
      action: "USER_UPDATE",
      entity: "User",
      entityId: id,
      meta: { fields: Object.keys(data) },
    });
    return ok(user);
  } catch (err) {
    return handleError(err);
  }
}
