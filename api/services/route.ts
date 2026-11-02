import { prisma } from "@/lib/db";
import { handleError, ok, requireApi } from "@/lib/api";
import { serviceSchema } from "@/lib/validators";
import { audit } from "@/lib/audit";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const publicOnly = url.searchParams.get("public") === "1";
    if (!publicOnly) {
      const guard = await requireApi("SERVICE_VIEW");
      if (guard.error) return guard.error;
    }
    const q = url.searchParams.get("q")?.trim() ?? "";
    const services = await prisma.service.findMany({
      where: {
        ...(publicOnly ? { active: true } : {}),
        ...(q
          ? {
              OR: [
                { name: { contains: q } },
                { category: { contains: q } },
                { code: { contains: q } },
              ],
            }
          : {}),
      },
      orderBy: [{ category: "asc" }, { name: "asc" }],
    });
    return ok(services);
  } catch (err) {
    return handleError(err);
  }
}

export async function POST(req: Request) {
  try {
    const guard = await requireApi("SERVICE_CREATE");
    if (guard.error) return guard.error;
    const data = serviceSchema.parse(await req.json());
    const service = await prisma.service.create({
      data: { ...data, description: data.description || null },
    });
    await audit({
      userId: guard.user.id,
      action: "SERVICE_CREATE",
      entity: "Service",
      entityId: service.id,
    });
    return ok(service, { status: 201 });
  } catch (err) {
    return handleError(err);
  }
}
