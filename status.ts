export const BOOKING_STATUS = [
  "MENUNGGU",
  "DIKONFIRMASI",
  "MENUNGGU_PEMBAYARAN",
  "DP_DIBAYAR",
  "DIJADWALKAN",
  "ALAT_DITERIMA",
  "DIAGNOSIS",
  "MENUNGGU_PERSETUJUAN",
  "DALAM_PENGERJAAN",
  "SELESAI",
  "SIAP_DIAMBIL",
  "LUNAS",
  "DIBATALKAN",
] as const;

export type BookingStatus = (typeof BOOKING_STATUS)[number];

export const SERVICE_ORDER_STATUS = [
  "DRAFT",
  "RECEIVED",
  "DIAGNOSING",
  "WAITING_APPROVAL",
  "IN_PROGRESS",
  "COMPLETED",
  "READY_FOR_PICKUP",
  "PAID",
  "CLOSED",
  "CANCELLED",
] as const;

export type ServiceOrderStatus = (typeof SERVICE_ORDER_STATUS)[number];

export const BOOKING_STATUS_LABEL: Record<string, string> = {
  MENUNGGU: "Menunggu Konfirmasi",
  DIKONFIRMASI: "Dikonfirmasi",
  MENUNGGU_PEMBAYARAN: "Menunggu Pembayaran",
  DP_DIBAYAR: "DP Dibayar",
  DIJADWALKAN: "Dijadwalkan",
  ALAT_DITERIMA: "Alat Diterima",
  DIAGNOSIS: "Diagnosis",
  MENUNGGU_PERSETUJUAN: "Menunggu Persetujuan",
  DALAM_PENGERJAAN: "Dalam Pengerjaan",
  SELESAI: "Selesai",
  SIAP_DIAMBIL: "Siap Diambil",
  LUNAS: "Lunas",
  DIBATALKAN: "Dibatalkan",
};

export const SERVICE_ORDER_STATUS_LABEL: Record<string, string> = {
  DRAFT: "Draft",
  RECEIVED: "Alat Diterima",
  DIAGNOSING: "Diagnosis",
  WAITING_APPROVAL: "Menunggu Persetujuan",
  IN_PROGRESS: "Dalam Pengerjaan",
  COMPLETED: "Selesai",
  READY_FOR_PICKUP: "Siap Diambil",
  PAID: "Lunas",
  CLOSED: "Ditutup",
  CANCELLED: "Dibatalkan",
};

export const STATUS_STYLE: Record<string, string> = {
  MENUNGGU: "bg-amber-500/10 text-amber-300 ring-amber-500/30",
  DIKONFIRMASI: "bg-sky-500/10 text-sky-300 ring-sky-500/30",
  MENUNGGU_PEMBAYARAN: "bg-orange-500/10 text-orange-300 ring-orange-500/30",
  DP_DIBAYAR: "bg-teal-500/10 text-teal-300 ring-teal-500/30",
  DIJADWALKAN: "bg-indigo-500/10 text-indigo-300 ring-indigo-500/30",
  ALAT_DITERIMA: "bg-blue-500/10 text-blue-300 ring-blue-500/30",
  DIAGNOSIS: "bg-purple-500/10 text-purple-300 ring-purple-500/30",
  MENUNGGU_PERSETUJUAN: "bg-yellow-500/10 text-yellow-200 ring-yellow-500/30",
  DALAM_PENGERJAAN: "bg-cyan-500/10 text-cyan-300 ring-cyan-500/30",
  SELESAI: "bg-emerald-500/10 text-emerald-300 ring-emerald-500/30",
  SIAP_DIAMBIL: "bg-lime-500/10 text-lime-300 ring-lime-500/30",
  LUNAS: "bg-emerald-500/15 text-emerald-200 ring-emerald-500/40",
  DIBATALKAN: "bg-rose-500/10 text-rose-300 ring-rose-500/30",
  DRAFT: "bg-slate-500/10 text-slate-300 ring-slate-500/30",
  RECEIVED: "bg-blue-500/10 text-blue-300 ring-blue-500/30",
  DIAGNOSING: "bg-purple-500/10 text-purple-300 ring-purple-500/30",
  WAITING_APPROVAL: "bg-yellow-500/10 text-yellow-200 ring-yellow-500/30",
  IN_PROGRESS: "bg-cyan-500/10 text-cyan-300 ring-cyan-500/30",
  COMPLETED: "bg-emerald-500/10 text-emerald-300 ring-emerald-500/30",
  READY_FOR_PICKUP: "bg-lime-500/10 text-lime-300 ring-lime-500/30",
  PAID: "bg-emerald-500/15 text-emerald-200 ring-emerald-500/40",
  CLOSED: "bg-slate-500/10 text-slate-400 ring-slate-500/30",
  CANCELLED: "bg-rose-500/10 text-rose-300 ring-rose-500/30",
  UNPAID: "bg-rose-500/10 text-rose-300 ring-rose-500/30",
  PARTIAL: "bg-amber-500/10 text-amber-300 ring-amber-500/30",
  VOID: "bg-slate-500/10 text-slate-400 ring-slate-500/30",
};

export const BOOKING_TRANSITIONS: Record<string, string[]> = {
  MENUNGGU: ["DIKONFIRMASI", "MENUNGGU_PEMBAYARAN", "DIBATALKAN"],
  DIKONFIRMASI: [
    "MENUNGGU_PEMBAYARAN",
    "DIJADWALKAN",
    "ALAT_DITERIMA",
    "DIBATALKAN",
  ],
  MENUNGGU_PEMBAYARAN: ["DP_DIBAYAR", "DIJADWALKAN", "DIBATALKAN"],
  DP_DIBAYAR: ["DIJADWALKAN", "ALAT_DITERIMA", "DIBATALKAN"],
  DIJADWALKAN: ["ALAT_DITERIMA", "DIBATALKAN"],
  ALAT_DITERIMA: ["DIAGNOSIS", "DIBATALKAN"],
  DIAGNOSIS: ["MENUNGGU_PERSETUJUAN", "DALAM_PENGERJAAN", "DIBATALKAN"],
  MENUNGGU_PERSETUJUAN: ["DALAM_PENGERJAAN", "DIBATALKAN"],
  DALAM_PENGERJAAN: ["SELESAI", "DIBATALKAN"],
  SELESAI: ["SIAP_DIAMBIL"],
  SIAP_DIAMBIL: ["LUNAS"],
  LUNAS: [],
  DIBATALKAN: [],
};

export const SERVICE_ORDER_TRANSITIONS: Record<string, string[]> = {
  DRAFT: ["RECEIVED", "CANCELLED"],
  RECEIVED: ["DIAGNOSING", "CANCELLED"],
  DIAGNOSING: ["WAITING_APPROVAL", "IN_PROGRESS", "CANCELLED"],
  WAITING_APPROVAL: ["IN_PROGRESS", "CANCELLED"],
  IN_PROGRESS: ["COMPLETED", "CANCELLED"],
  COMPLETED: ["READY_FOR_PICKUP", "PAID"],
  READY_FOR_PICKUP: ["PAID"],
  PAID: ["CLOSED"],
  CLOSED: [],
  CANCELLED: [],
};

export const ORDER_TO_BOOKING_STATUS: Record<string, string> = {
  RECEIVED: "ALAT_DITERIMA",
  DIAGNOSING: "DIAGNOSIS",
  WAITING_APPROVAL: "MENUNGGU_PERSETUJUAN",
  IN_PROGRESS: "DALAM_PENGERJAAN",
  COMPLETED: "SELESAI",
  READY_FOR_PICKUP: "SIAP_DIAMBIL",
  PAID: "LUNAS",
  CLOSED: "LUNAS",
  CANCELLED: "DIBATALKAN",
};

export const PAYMENT_METHODS = [
  { value: "CASH", label: "Tunai" },
  { value: "TRANSFER", label: "Transfer Bank" },
  { value: "QRIS", label: "QRIS" },
  { value: "EWALLET", label: "E-Wallet" },
] as const;

export const PAYMENT_METHOD_LABEL: Record<string, string> = {
  CASH: "Tunai",
  TRANSFER: "Transfer Bank",
  QRIS: "QRIS",
  EWALLET: "E-Wallet",
};

export const INSTRUMENTS = [
  "Gitar",
  "Bass",
  "Keyboard",
  "Drum",
  "Amplifier",
  "Mikrofon",
  "Saxophone",
  "Biola",
  "Ukulele",
  "Lainnya",
] as const;

export function statusLabel(status: string, kind: "booking" | "order" = "booking") {
  return kind === "order"
    ? SERVICE_ORDER_STATUS_LABEL[status] ?? status
    : BOOKING_STATUS_LABEL[status] ?? status;
}

export function timelineForStatus(kind: "booking" | "order", status: string) {
  if (kind === "booking") {
    const steps = [
      "MENUNGGU",
      "DIKONFIRMASI",
      "ALAT_DITERIMA",
      "DIAGNOSIS",
      "MENUNGGU_PERSETUJUAN",
      "DALAM_PENGERJAAN",
      "SELESAI",
      "SIAP_DIAMBIL",
      "LUNAS",
    ];
    const labels = [
      "Booking diterima",
      "Dikonfirmasi admin",
      "Alat diterima",
      "Diagnosis",
      "Menunggu persetujuan biaya",
      "Sedang dikerjakan",
      "Servis selesai",
      "Siap diambil",
      "Lunas",
    ];
    return buildTimeline(steps, labels, status);
  }
  const steps = [
    "RECEIVED",
    "DIAGNOSING",
    "WAITING_APPROVAL",
    "IN_PROGRESS",
    "COMPLETED",
    "READY_FOR_PICKUP",
    "PAID",
  ];
  const labels = [
    "Alat diterima",
    "Diagnosis",
    "Menunggu persetujuan",
    "Sedang dikerjakan",
    "Servis selesai",
    "Siap diambil",
    "Pembayaran lunas",
  ];
  return buildTimeline(steps, labels, status);
}

function buildTimeline(steps: string[], labels: string[], status: string) {
  const actual =
    status === "DIBATALKAN" || status === "CANCELLED"
      ? -1
      : steps.indexOf(status);
  return steps.map((step, i) => ({
    key: step,
    label: labels[i],
    done: actual >= 0 && i < actual,
    active: actual === i,
  }));
}
