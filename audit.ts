import "server-only";
import { prisma } from "./db";

export async function audit(input: {
  userId?: string | null;
  action: string;
  entity: string;
  entityId?: string | null;
  meta?: unknown;
  ip?: string | null;
}) {
  try {
    await prisma.auditLog.create({
      data: {
        userId: input.userId ?? null,
        action: input.action,
        entity: input.entity,
        entityId: input.entityId ?? null,
        meta: input.meta ? JSON.stringify(input.meta) : null,
        ip: input.ip ?? null,
      },
    });
  } catch (err) {
    console.error("[audit]", err);
  }
}
