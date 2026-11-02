import "server-only";
import { prisma } from "./db";

export type BusinessSettings = {
  businessName: string;
  tagline: string;
  address: string;
  phone: string;
  whatsapp: string;
  email: string;
  openingHours: string;
  bookingMode: "GRATIS" | "DP_NOMINAL" | "DP_PERSEN";
  dpNominal: number;
  dpPercent: number;
  paymentDeadlineHours: number;
  cancellationPolicy: string;
  invoiceFooter: string;
};

export const DEFAULT_SETTINGS: BusinessSettings = {
  businessName: "BagusMusik",
  tagline: "Servis & Reparasi Alat Musik",
  address: "Kab. Pekalongan Kec. Kajen Ds. Tambakroto Dk. Kelapasawit",
  phone: "085888058830",
  whatsapp: "085888058830",
  email: "baguswidagdo117@gamil.com",
  openingHours: "Senin - Sabtu, 09.00 - 20.00 WIB",
  bookingMode: "GRATIS",
  dpNominal: 50000,
  dpPercent: 30,
  paymentDeadlineHours: 24,
  cancellationPolicy:
    "Booking gratis dapat dibatalkan kapan saja. DP yang sudah dibayar dikembalikan maksimal 50% bila servis belum dimulai.",
  invoiceFooter: "Terima kasih telah mempercayakan alat musik Anda kepada BagusMusik.",
};

export async function getSettings(): Promise<BusinessSettings> {
  const rows = await prisma.setting.findMany();
  const map = Object.fromEntries(rows.map((r) => [r.key, r.value]));
  const parsed: BusinessSettings = { ...DEFAULT_SETTINGS };

  if (map.businessName) parsed.businessName = map.businessName;
  if (map.tagline) parsed.tagline = map.tagline;
  if (map.address) parsed.address = map.address;
  if (map.phone) parsed.phone = map.phone;
  if (map.whatsapp) parsed.whatsapp = map.whatsapp;
  if (map.email) parsed.email = map.email;
  if (map.openingHours) parsed.openingHours = map.openingHours;
  if (map.bookingMode)
    parsed.bookingMode = map.bookingMode as BusinessSettings["bookingMode"];
  if (map.dpNominal) parsed.dpNominal = Number(map.dpNominal);
  if (map.dpPercent) parsed.dpPercent = Number(map.dpPercent);
  if (map.paymentDeadlineHours)
    parsed.paymentDeadlineHours = Number(map.paymentDeadlineHours);
  if (map.cancellationPolicy)
    parsed.cancellationPolicy = map.cancellationPolicy;
  if (map.invoiceFooter) parsed.invoiceFooter = map.invoiceFooter;
  return parsed;
}

export async function saveSettings(input: Partial<BusinessSettings>) {
  const entries = Object.entries(input).filter(
    ([, value]) => value !== undefined && value !== null,
  );
  await prisma.$transaction(
    entries.map(([key, value]) =>
      prisma.setting.upsert({
        where: { key },
        create: { key, value: String(value) },
        update: { value: String(value) },
      }),
    ),
  );
}

export function expectedDp(settings: BusinessSettings, estimate: number) {
  if (settings.bookingMode === "GRATIS") return 0;
  if (settings.bookingMode === "DP_NOMINAL") return settings.dpNominal;
  return Math.round((estimate * settings.dpPercent) / 100);
}
