import { z } from "zod";

const phone = z
  .string()
  .trim()
  .min(8, "Nomor WhatsApp terlalu pendek")
  .max(20, "Nomor WhatsApp terlalu panjang")
  .regex(/^[0-9+\-\s()]+$/, "Nomor WhatsApp tidak valid");

export const customerSchema = z.object({
  name: z.string().trim().min(2, "Nama minimal 2 karakter").max(120),
  whatsapp: phone,
  email: z.string().trim().email("Email tidak valid").optional().or(z.literal("")),
  address: z.string().trim().max(300).optional().or(z.literal("")),
  notes: z.string().trim().max(500).optional().or(z.literal("")),
});

export const publicBookingSchema = z.object({
  name: z.string().trim().min(2, "Nama minimal 2 karakter").max(120),
  whatsapp: phone,
  email: z.string().trim().email("Email tidak valid").optional().or(z.literal("")),
  instrumentType: z.string().trim().min(1, "Pilih jenis alat musik"),
  brand: z.string().trim().max(80).optional().or(z.literal("")),
  model: z.string().trim().max(80).optional().or(z.literal("")),
  serialNumber: z.string().trim().max(80).optional().or(z.literal("")),
  complaint: z.string().trim().min(10, "Ceritakan keluhan minimal 10 karakter").max(2000),
  serviceId: z.string().optional().or(z.literal("")),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Tanggal tidak valid"),
  time: z.string().regex(/^\d{2}:\d{2}$/, "Jam tidak valid"),
  notes: z.string().trim().max(1000).optional().or(z.literal("")),
  photoUrl: z.string().max(500).optional().or(z.literal("")),
  source: z.string().max(40).optional().or(z.literal("")),
});

export const bookingUpdateSchema = z.object({
  status: z.string().min(1),
  technicianId: z.string().optional().or(z.literal("")),
  note: z.string().max(1000).optional().or(z.literal("")),
});

export const serviceSchema = z.object({
  code: z.string().trim().min(2).max(30),
  name: z.string().trim().min(2).max(120),
  category: z.string().trim().min(2).max(60),
  description: z.string().trim().max(500).optional().or(z.literal("")),
  price: z.coerce.number().min(0),
  durationMin: z.coerce.number().int().min(5).max(10000),
  active: z.boolean().optional(),
});

export const serviceOrderSchema = z.object({
  customerId: z.string().min(1).optional(),
  bookingId: z.string().optional().or(z.literal("")),
  technicianId: z.string().optional().or(z.literal("")),
  instrumentType: z.string().min(1),
  brand: z.string().max(80).optional().or(z.literal("")),
  model: z.string().max(80).optional().or(z.literal("")),
  serialNumber: z.string().max(80).optional().or(z.literal("")),
  initialCondition: z.string().max(1000).optional().or(z.literal("")),
  complaint: z.string().min(3).max(2000),
  diagnosis: z.string().max(2000).optional().or(z.literal("")),
  serviceFee: z.coerce.number().min(0).optional(),
  estimateCost: z.coerce.number().min(0).optional(),
  estimatedDone: z.string().optional().or(z.literal("")),
  status: z.string().optional(),
  technicianNotes: z.string().max(2000).optional().or(z.literal("")),
  beforePhoto: z.string().max(500).optional().or(z.literal("")),
  afterPhoto: z.string().max(500).optional().or(z.literal("")),
});

export const serviceOrderUpdateSchema = serviceOrderSchema.partial();

export const serviceItemSchema = z.object({
  type: z.enum(["JASA", "PART"]),
  serviceId: z.string().optional().or(z.literal("")),
  inventoryId: z.string().optional().or(z.literal("")),
  description: z.string().trim().max(160).optional().or(z.literal("")),
  qty: z.coerce.number().int().min(1).max(999),
  unitPrice: z.coerce.number().min(0).optional(),
});

export const inventorySchema = z.object({
  sku: z.string().trim().min(2).max(40),
  name: z.string().trim().min(2).max(120),
  category: z.string().trim().min(2).max(60),
  supplierId: z.string().optional().or(z.literal("")),
  purchasePrice: z.coerce.number().min(0),
  sellPrice: z.coerce.number().min(0),
  stock: z.coerce.number().int().min(0).optional(),
  minStock: z.coerce.number().int().min(0).optional(),
  unit: z.string().trim().max(20).optional(),
  active: z.boolean().optional(),
});

export const stockTxSchema = z.object({
  type: z.enum(["IN", "OUT", "ADJUST"]),
  qty: z.coerce.number().int().min(1).max(100000),
  note: z.string().max(300).optional().or(z.literal("")),
});

export const supplierSchema = z.object({
  name: z.string().trim().min(2).max(120),
  contact: z.string().trim().max(120).optional().or(z.literal("")),
  phone: phone.optional().or(z.literal("")),
  email: z.string().trim().email("Email tidak valid").optional().or(z.literal("")),
  address: z.string().trim().max(300).optional().or(z.literal("")),
});

export const saleItemSchema = z.object({
  type: z.enum(["JASA", "PART", "LAINNYA"]),
  serviceId: z.string().optional().or(z.literal("")),
  inventoryId: z.string().optional().or(z.literal("")),
  description: z.string().trim().min(2).max(160),
  qty: z.coerce.number().int().min(1).max(999),
  unitPrice: z.coerce.number().min(0),
});

export const saleSchema = z.object({
  customerId: z.string().optional().or(z.literal("")),
  serviceOrderId: z.string().optional().or(z.literal("")),
  items: z.array(saleItemSchema).min(1, "Minimal satu item"),
  discount: z.coerce.number().min(0).default(0),
  notes: z.string().max(500).optional().or(z.literal("")),
  dpAmount: z.coerce.number().min(0).optional(),
  paymentMethod: z.enum(["CASH", "TRANSFER", "QRIS", "EWALLET"]).optional(),
});

export const paymentSchema = z.object({
  saleId: z.string().optional().or(z.literal("")),
  serviceOrderId: z.string().optional().or(z.literal("")),
  bookingId: z.string().optional().or(z.literal("")),
  customerId: z.string().optional().or(z.literal("")),
  amount: z.coerce.number().positive("Nominal harus lebih dari 0"),
  method: z.enum(["CASH", "TRANSFER", "QRIS", "EWALLET"]).default("CASH"),
  type: z.enum(["DP", "PELUNASAN", "REFUND"]).default("PELUNASAN"),
  reference: z.string().max(120).optional().or(z.literal("")),
});

export const expenseSchema = z.object({
  category: z.string().trim().min(2).max(60),
  description: z.string().trim().min(2).max(300),
  amount: z.coerce.number().positive(),
  date: z.string().optional(),
});

export const settingsSchema = z.object({
  businessName: z.string().trim().min(2).max(80),
  tagline: z.string().trim().max(120),
  address: z.string().trim().max(300),
  phone: z.string().trim().max(30),
  whatsapp: z.string().trim().max(30),
  email: z.string().trim().email("Email tidak valid"),
  openingHours: z.string().trim().max(120),
  bookingMode: z.enum(["GRATIS", "DP_NOMINAL", "DP_PERSEN"]),
  dpNominal: z.coerce.number().min(0),
  dpPercent: z.coerce.number().min(0).max(100),
  paymentDeadlineHours: z.coerce.number().int().min(1).max(720),
  cancellationPolicy: z.string().max(1000),
  invoiceFooter: z.string().max(300),
});

export const technicianSchema = z.object({
  name: z.string().trim().min(2).max(120),
  email: z.string().trim().email(),
  password: z.string().min(6).max(100).optional().or(z.literal("")),
  phone: z.string().max(30).optional().or(z.literal("")),
  specialization: z.string().max(120).optional().or(z.literal("")),
});

export const userSchema = z.object({
  name: z.string().trim().min(2).max(120),
  email: z.string().trim().email(),
  password: z.string().min(6, "Password minimal 6 karakter").max(100),
  role: z.enum(["OWNER", "ADMIN", "KASIR", "TEKNISI"]),
  phone: z.string().max(30).optional().or(z.literal("")),
});
