"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { INSTRUMENTS } from "@/lib/status";
import { Modal } from "../modal";
import { toast } from "../toast";
import { Icon } from "../icons";

type CustomerOption = { id: string; name: string; whatsapp: string };
type TechnicianOption = {
  id: string;
  name: string;
  specialization?: string | null;
};
type BookingSource = {
  id: string;
  bookingNumber: string;
  customerId: string;
  customerName: string;
  instrumentType: string;
  brand?: string | null;
  model?: string | null;
  serialNumber?: string | null;
  complaint: string;
};

export function NewWorkOrderButton({
  customers,
  technicians,
  booking,
  openOnLoad = false,
}: {
  customers: CustomerOption[];
  technicians: TechnicianOption[];
  booking?: BookingSource | null;
  openOnLoad?: boolean;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(openOnLoad);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    const form = new FormData(event.currentTarget);
    const payload = {
      bookingId: booking?.id ?? "",
      customerId: booking?.customerId ?? String(form.get("customerId") || ""),
      instrumentType: String(form.get("instrumentType") || ""),
      brand: String(form.get("brand") || ""),
      model: String(form.get("model") || ""),
      serialNumber: String(form.get("serialNumber") || ""),
      complaint: String(form.get("complaint") || ""),
      initialCondition: String(form.get("initialCondition") || ""),
      diagnosis: String(form.get("diagnosis") || ""),
      technicianId: String(form.get("technicianId") || ""),
      serviceFee: Number(form.get("serviceFee") || 0),
      estimateCost: Number(form.get("estimateCost") || 0),
      estimatedDone: String(form.get("estimatedDone") || ""),
      status: "RECEIVED",
    };

    if (!booking && !payload.customerId) {
      setError("Pilih pelanggan terlebih dahulu.");
      return;
    }
    if (!payload.instrumentType) {
      setError("Pilih jenis instrumen.");
      return;
    }
    if (payload.complaint.trim().length < 3) {
      setError("Keluhan minimal 3 karakter.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/service-orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Gagal membuat work order.");
      toast(`Work order ${json.data.orderNumber} dibuat.`);
      setOpen(false);
      router.push(`/admin/work-orders/${json.data.id}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className="btn-primary">
        <Icon name="plus" className="h-4 w-4" />
        Work Order Baru
      </button>
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Buat Work Order"
        description={
          booking
            ? `Dari booking ${booking.bookingNumber}`
            : "Terima alat dan mulai pekerjaan servis."
        }
        size="lg"
        footer={
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="btn-ghost-dark"
            >
              Batal
            </button>
            <button
              type="submit"
              form="new-work-order"
              disabled={loading}
              className="btn-primary"
            >
              {loading ? (
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-ink-950/30 border-t-ink-950" />
              ) : (
                <Icon name="check" className="h-4 w-4" />
              )}
              Simpan Work Order
            </button>
          </div>
        }
      >
        <form id="new-work-order" onSubmit={onSubmit} className="space-y-4">
          {booking ? (
            <div className="rounded-xl border border-brass-500/25 bg-brass-500/10 p-3">
              <p className="text-xs font-semibold text-brass-200">
                {booking.bookingNumber} · {booking.customerName}
              </p>
              <p className="mt-0.5 text-xs text-brass-200/70">
                {booking.instrumentType}
                {booking.brand ? ` · ${booking.brand}` : ""}
              </p>
            </div>
          ) : (
            <div>
              <label htmlFor="customerId" className="label-dark">
                Pelanggan *
              </label>
              <select
                id="customerId"
                name="customerId"
                className="select-dark"
                required
                defaultValue=""
              >
                <option value="">Pilih pelanggan...</option>
                {customers.map((customer) => (
                  <option key={customer.id} value={customer.id}>
                    {customer.name} · {customer.whatsapp}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label htmlFor="instrumentType" className="label-dark">
                Jenis instrumen *
              </label>
              <select
                id="instrumentType"
                name="instrumentType"
                className="select-dark"
                required
                defaultValue={booking?.instrumentType ?? ""}
              >
                <option value="">Pilih...</option>
                {INSTRUMENTS.map((instrument) => (
                  <option key={instrument} value={instrument}>
                    {instrument}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="technicianId" className="label-dark">
                Teknisi
              </label>
              <select
                id="technicianId"
                name="technicianId"
                className="select-dark"
                defaultValue=""
              >
                <option value="">Belum ditugaskan</option>
                {technicians.map((technician) => (
                  <option key={technician.id} value={technician.id}>
                    {technician.name}
                    {technician.specialization
                      ? ` · ${technician.specialization}`
                      : ""}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="brand" className="label-dark">
                Merek
              </label>
              <input
                id="brand"
                name="brand"
                className="input-dark"
                defaultValue={booking?.brand ?? ""}
                placeholder="Yamaha, Fender..."
              />
            </div>
            <div>
              <label htmlFor="model" className="label-dark">
                Model
              </label>
              <input
                id="model"
                name="model"
                className="input-dark"
                defaultValue={booking?.model ?? ""}
                placeholder="Tipe / model"
              />
            </div>
            <div>
              <label htmlFor="serialNumber" className="label-dark">
                Nomor seri
              </label>
              <input
                id="serialNumber"
                name="serialNumber"
                className="input-dark"
                defaultValue={booking?.serialNumber ?? ""}
                placeholder="Opsional"
              />
            </div>
            <div>
              <label htmlFor="estimatedDone" className="label-dark">
                Estimasi selesai
              </label>
              <input
                id="estimatedDone"
                name="estimatedDone"
                type="date"
                className="input-dark"
              />
            </div>
          </div>

          <div>
            <label htmlFor="complaint" className="label-dark">
              Keluhan pelanggan *
            </label>
            <textarea
              id="complaint"
              name="complaint"
              className="textarea-dark min-h-20"
              required
              defaultValue={booking?.complaint ?? ""}
              placeholder="Deskripsikan keluhan atau permintaan servis..."
            />
          </div>

          <div>
            <label htmlFor="initialCondition" className="label-dark">
              Kondisi awal
            </label>
            <textarea
              id="initialCondition"
              name="initialCondition"
              className="textarea-dark min-h-16"
              placeholder="Kondisi fisik alat saat diterima..."
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label htmlFor="serviceFee" className="label-dark">
                Biaya jasa (Rp)
              </label>
              <input
                id="serviceFee"
                name="serviceFee"
                type="number"
                min={0}
                step={1000}
                className="input-dark"
                placeholder="0"
              />
            </div>
            <div>
              <label htmlFor="estimateCost" className="label-dark">
                Estimasi total (Rp)
              </label>
              <input
                id="estimateCost"
                name="estimateCost"
                type="number"
                min={0}
                step={1000}
                className="input-dark"
                placeholder="0"
              />
            </div>
          </div>

          {error ? (
            <p className="rounded-lg border border-rose-500/25 bg-rose-500/10 px-3 py-2 text-xs font-medium text-rose-300">
              {error}
            </p>
          ) : null}
        </form>
      </Modal>
    </>
  );
}
