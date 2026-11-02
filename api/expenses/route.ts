import { prisma } from "@/lib/db";
import { getPagination, handleError, ok, requireApi } from "@/lib/api";
import { expenseSchema } from "@/lib/validators";
import { audit } from "@/lib/audit";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const guard = await requireApi("FINANCE_VIEW");
    if (guard.error) return guard.error;
    const url = new URL(req.url);
    const { page, perPage, skip, take } = getPagination(url);
    const [items, total] = await Promise.all([
      prisma.expense.findMany({
        orderBy: { date: "desc" },
        skip,
        take,
      }),
      prisma.expense.count(),
    ]);
    return ok({ items, total, page, perPage });
  } catch (err) {
    return handleError(err);
  }
}

export async function POST(req: Request) {
  try {
    const guard = await requireApi("EXPENSE_MANAGE");
    if (guard.error) return guard.error;
    const data = expenseSchema.parse(await req.json());
    const expense = await prisma.expense.create({
      data: {
        category: data.category,
        description: data.description,
        amount: data.amount,
        date: data.date ? new Date(`${data.date}T12:00:00`) : new Date(),
        createdBy: guard.user.id,
      },
    });
    await audit({
      userId: guard.user.id,
      action: "EXPENSE_CREATE",
      entity: "Expense",
      entityId: expense.id,
      meta: { amount: data.amount },
    });
    return ok(expense, { status: 201 });
  } catch (err) {
    return handleError(err);
  }
}
