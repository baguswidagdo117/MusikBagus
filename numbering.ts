import "server-only";
import { prisma } from "./db";

function year() {
  return new Date().getFullYear();
}

function pad(n: number, size = 5) {
  return String(n).padStart(size, "0");
}

export async function nextBookingNumber() {
  const count = await prisma.booking.count({
    where: { createdAt: { gte: new Date(`${year()}-01-01`) } },
  });
  return `BK-${year()}-${pad(count + 1)}`;
}

export async function nextServiceOrderNumber() {
  const count = await prisma.serviceOrder.count({
    where: { createdAt: { gte: new Date(`${year()}-01-01`) } },
  });
  return `SO-${year()}-${pad(count + 1)}`;
}

export async function nextSaleNumber() {
  const count = await prisma.sale.count({
    where: { createdAt: { gte: new Date(`${year()}-01-01`) } },
  });
  return `SL-${year()}-${pad(count + 1)}`;
}

export async function nextInvoiceNumber() {
  const count = await prisma.invoice.count({
    where: { issuedAt: { gte: new Date(`${year()}-01-01`) } },
  });
  return `INV-${year()}-${pad(count + 1)}`;
}

export async function nextCustomerCode() {
  const count = await prisma.customer.count();
  return `CUST-${pad(count + 1, 4)}`;
}
