import { prisma } from "@/lib/db";
import { fail, getPagination, handleError, ok, requireApi } from "@/lib/api";
import { saleSchema } from "@/lib/validators";
import { nextInvoiceNumber, nextSaleNumber } from "@/lib/numbering";
import { applyStockChange } from "@/lib/inventory";
import { BusinessError } from "@/lib/bookings";
import { audit } from "@/lib/audit";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const guard = await requireApi("POS_VIEW");
    if (guard.error) return guard.error;
    const url = new URL(req.url);
    const q = url.searchParams.get("q")?.trim() ?? "";
    const status = url.searchParams.get("status") ?? "";
    const { page, perPage, skip, take } = getPagination(url);
    const where = {
      ...(status ? { paymentStatus: status } : {}),
      ...(q
        ? {
            OR: [
              { saleNumber: { contains: q } },
              { customer: { name: { contains: q } } },
            ],
          }
        : {}),
    };
    const [items, total] = await Promise.all([
      prisma.sale.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take,
        include: {
          customer: true,
          items: true,
          invoice: true,
          serviceOrder: { select: { orderNumber: true, id: true } },
          cashier: { select: { name: true } },
          payments: { orderBy: { paidAt: "desc" } },
        },
      }),
      prisma.sale.count({ where }),
    ]);
    return ok({ items, total, page, perPage });
  } catch (err) {
    return handleError(err);
  }
}

export async function POST(req: Request) {
  try {
    const guard = await requireApi("POS_CREATE");
    if (guard.error) return guard.error;
    const data = saleSchema.parse(await req.json());

    const saleId = await prisma.$transaction(async (tx) => {
      const prepared = [];
      let subtotal = 0;

      for (const item of data.items) {
        let unitPrice = item.unitPrice;
        let description = item.description;
        let inventoryId: string | null = null;
        let serviceId: string | null = null;

        if (item.type === "PART") {
          if (!item.inventoryId) throw new BusinessError("Spare part wajib dipilih.", 422);
          const inv = await tx.inventory.findUnique({
            where: { id: item.inventoryId },
          });
          if (!inv || !inv.active) throw new BusinessError("Spare part tidak ditemukan.", 404);
          if (!unitPrice) unitPrice = Number(inv.sellPrice);
          if (!description) description = inv.name;
          inventoryId = inv.id;
          await applyStockChange(tx, {
            inventoryId: inv.id,
            delta: -item.qty,
            type: "OUT",
            note: "Penjualan POS",
            refType: "SALE",
            refId: null,
            userId: guard.user.id,
          });
        } else if (item.serviceId) {
          const svc = await tx.service.findUnique({ where: { id: item.serviceId } });
          if (!svc) throw new BusinessError("Layanan tidak ditemukan.", 404);
          if (!unitPrice) unitPrice = Number(svc.price);
          if (!description) description = svc.name;
          serviceId = svc.id;
        }

        if (!description) throw new BusinessError("Deskripsi item wajib diisi.", 422);
        const lineTotal = unitPrice * item.qty;
        subtotal += lineTotal;
        prepared.push({
          type: item.type,
          inventoryId,
          serviceId,
          description,
          qty: item.qty,
          unitPrice,
          subtotal: lineTotal,
        });
      }

      const discount = data.discount || 0;
      const total = Math.max(0, subtotal - discount);
      const dp = data.dpAmount || 0;
      if (dp > total) throw new BusinessError("DP melebihi total transaksi.", 422);

      let orderInvoice = null;
      let order = null;
      if (data.serviceOrderId) {
        order = await tx.serviceOrder.findUnique({
          where: { id: data.serviceOrderId },
          include: { invoice: true },
        });
        if (!order) throw new BusinessError("Work order tidak ditemukan.", 404);
        orderInvoice = order.invoice;
      }

      const sale = await tx.sale.create({
        data: {
          saleNumber: await nextSaleNumber(),
          customerId: data.customerId || order?.customerId || null,
          serviceOrderId: order?.id ?? null,
          subtotal,
          discount,
          total,
          paid: dp,
          paymentStatus: dp <= 0 ? "UNPAID" : dp >= total ? "PAID" : "PARTIAL",
          cashierId: guard.user.id,
          notes: data.notes || null,
        },
      });

      for (const line of prepared) {
        await tx.saleItem.create({ data: { saleId: sale.id, ...line } });
        if (line.inventoryId) {
          await tx.inventoryTransaction.updateMany({
            where: {
              inventoryId: line.inventoryId,
              refType: "SALE",
              refId: null,
              type: "OUT",
            },
            data: { refId: sale.id },
          });
        }
      }

      if (dp > 0) {
        await tx.payment.create({
          data: {
            saleId: sale.id,
            customerId: sale.customerId,
            serviceOrderId: order?.id ?? null,
            amount: dp,
            method: data.paymentMethod || "CASH",
            type: "DP",
            cashierId: guard.user.id,
          },
        });
      }

      if (orderInvoice) {
        await tx.invoice.update({
          where: { id: orderInvoice.id },
          data: {
            saleId: sale.id,
            total,
            status: dp >= total ? "PAID" : "UNPAID",
          },
        });
      } else if (sale.customerId) {
        await tx.invoice.create({
          data: {
            invoiceNumber: await nextInvoiceNumber(),
            saleId: sale.id,
            serviceOrderId: order?.id ?? null,
            customerId: sale.customerId,
            total,
            status: dp >= total ? "PAID" : "UNPAID",
          },
        });
      }

      return sale.id;
    });

    await audit({
      userId: guard.user.id,
      action: "SALE_CREATE",
      entity: "Sale",
      entityId: saleId,
      meta: { items: data.items.length, total: data.items.length },
    });

    const sale = await prisma.sale.findUnique({
      where: { id: saleId },
      include: { items: true, customer: true, invoice: true, payments: true },
    });
    return ok(sale, { status: 201 });
  } catch (err) {
    if (err instanceof BusinessError) return fail(err.message, err.status);
    return handleError(err);
  }
}
