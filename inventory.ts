import "server-only";
import type { Prisma } from "@prisma/client";
import { BusinessError } from "./bookings";

export async function applyStockChange(
  tx: Prisma.TransactionClient,
  input: {
    inventoryId: string;
    delta: number;
    type: "IN" | "OUT" | "ADJUST";
    note?: string | null;
    refType?: string | null;
    refId?: string | null;
    userId?: string | null;
  },
) {
  const item = await tx.inventory.findUnique({
    where: { id: input.inventoryId },
  });
  if (!item) throw new BusinessError("Spare part tidak ditemukan.", 404);

  const newStock = item.stock + input.delta;
  if (newStock < 0) {
    throw new BusinessError(
      `Stok ${item.name} tidak mencukupi. Tersedia ${item.stock}, diminta ${Math.abs(input.delta)}.`,
      422,
    );
  }

  await tx.inventory.update({
    where: { id: item.id },
    data: { stock: newStock },
  });

  await tx.inventoryTransaction.create({
    data: {
      inventoryId: item.id,
      type: input.type,
      qty: Math.abs(input.delta),
      note: input.note || null,
      refType: input.refType || null,
      refId: input.refId || null,
      userId: input.userId || null,
    },
  });

  return { item, newStock };
}

export async function getTechnicianIdForUser(userId: string) {
  const tech = await (await import("./db")).prisma.technician.findUnique({
    where: { userId },
    select: { id: true },
  });
  return tech?.id ?? null;
}
