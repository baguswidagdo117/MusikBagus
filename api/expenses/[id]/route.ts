import { prisma } from "@/lib/db";
import { fail, handleError, ok, requireApi } from "@/lib/api";
import { audit } from "@/lib/audit";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

export async function DELETE(_req: Request, { params }: Ctx) {
  try {
    const guard = await requireApi("EXPENSE_MANAGE");
    if (guard.error) return guard.error;
    const { id } = await params;
    const expense = await prisma.expense.findUnique({ where: { id } });
    if (!expense) return fail("Pengeluaran tidak ditemukan.", 404);
    await prisma.expense.delete({ where: { id } });
    await audit({
      userId: guard.user.id,
      action: "EXPENSE_DELETE",
      entity: "Expense",
      entityId: id,
    });
    return ok({ deleted: true });
  } catch (err) {
    return handleError(err);
  }
}
