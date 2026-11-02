import { prisma } from "@/lib/db";
import { fail, handleError, ok, requireApi } from "@/lib/api";
import { startOfMonth, startOfDay } from "@/lib/utils";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ type: string }> };

function parseRange(url: URL) {
  const from = url.searchParams.get("from");
  const to = url.searchParams.get("to");
  const start = from ? new Date(`${from}T00:00:00`) : startOfMonth();
  const end = to ? new Date(`${to}T23:59:59`) : new Date();
  return { start, end };
}

export async function GET(req: Request, { params }: Ctx) {
  try {
    const guard = await requireApi("REPORT_VIEW");
    if (guard.error) return guard.error;
    const { type } = await params;
    const url = new URL(req.url);
    const { start, end } = parseRange(url);
    const financeTypes = ["expenses", "profit-loss", "cash-flow"];

    if (financeTypes.includes(type) && guard.user.role !== "OWNER") {
      return fail("Laporan keuangan hanya untuk Owner.", 403);
    }

    if (type === "sales") {
      const sales = await prisma.sale.findMany({
        where: { createdAt: { gte: start, lte: end } },
        include: { items: true },
        orderBy: { createdAt: "asc" },
      });
      return ok({
        count: sales.length,
        total: sales.reduce((s, x) => s + Number(x.total), 0),
        paid: sales.reduce((s, x) => s + Number(x.paid), 0),
        items: sales,
      });
    }

    if (type === "revenue") {
      const payments = await prisma.payment.findMany({
        where: { paidAt: { gte: start, lte: end } },
        orderBy: { paidAt: "asc" },
      });
      const byMethod: Record<string, number> = {};
      for (const p of payments) {
        const amount = p.type === "REFUND" ? -Number(p.amount) : Number(p.amount);
        byMethod[p.method] = (byMethod[p.method] || 0) + amount;
      }
      return ok({
        total: Object.values(byMethod).reduce((s, v) => s + v, 0),
        byMethod,
        count: payments.length,
      });
    }

    if (type === "expenses") {
      const expenses = await prisma.expense.findMany({
        where: { date: { gte: start, lte: end } },
        orderBy: { date: "desc" },
      });
      return ok({
        total: expenses.reduce((s, x) => s + Number(x.amount), 0),
        items: expenses,
      });
    }

    if (type === "profit-loss") {
      const [sales, expenses] = await Promise.all([
        prisma.sale.aggregate({
          where: { createdAt: { gte: start, lte: end } },
          _sum: { total: true, paid: true },
        }),
        prisma.expense.aggregate({
          where: { date: { gte: start, lte: end } },
          _sum: { amount: true },
        }),
      ]);
      const revenue = Number(sales._sum.paid || 0);
      const expense = Number(expenses._sum.amount || 0);
      return ok({
        period: { start, end },
        revenue,
        expense,
        profit: revenue - expense,
        salesTotal: Number(sales._sum.total || 0),
      });
    }

    if (type === "cash-flow") {
      const [payments, expenses] = await Promise.all([
        prisma.payment.findMany({
          where: { paidAt: { gte: start, lte: end } },
        }),
        prisma.expense.findMany({
          where: { date: { gte: start, lte: end } },
        }),
      ]);
      const inflow = payments.reduce(
        (s, p) => s + (p.type === "REFUND" ? -Number(p.amount) : Number(p.amount)),
        0,
      );
      const outflow = expenses.reduce((s, e) => s + Number(e.amount), 0);
      return ok({ inflow, outflow, net: inflow - outflow });
    }

    if (type === "inventory") {
      const items = await prisma.inventory.findMany({
        include: { supplier: true },
        orderBy: { stock: "asc" },
      });
      const usage = await prisma.inventoryTransaction.findMany({
        where: { type: "OUT", createdAt: { gte: start, lte: end } },
        include: { inventory: true },
      });
      return ok({
        stockValue: items.reduce(
          (s, x) => s + Number(x.purchasePrice) * x.stock,
          0,
        ),
        lowStock: items.filter((x) => x.stock <= x.minStock),
        items,
        usage,
      });
    }

    return fail("Jenis laporan tidak dikenal.", 404);
  } catch (err) {
    return handleError(err);
  }
}
