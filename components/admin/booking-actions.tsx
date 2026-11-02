"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { BOOKING_TRANSITIONS, statusLabel } from "@/lib/status";
import { toast } from "../toast";
import { Icon } from "../icons";

export function BookingActions({
  bookingId,
  status,
  serviceOrderId,
  canUpdate,
  canCreateOrder,
}: {
  bookingId: string;
  status: string;
  serviceOrderId: string | null;
  canUpdate: boolean;
  canCreateOrder: boolean;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);
  const [choice, setChoice] = useState("");
  const allowed = (BOOKING_TRANSITIONS[status] ?? []).filter(
    (next) => next !== "DIBATALKAN",
  );
  const canCancel = (BOOKING_TRANSITIONS[status] ?? []).includes("DIBATALKAN");

  async function update(nextStatus: string) {
    if (nextStatus === "DIBATALKAN") {
      if (
        !window.confirm(
          "Batalkan booking ini? Tindakan ini tidak dapat diurungkan.",
        )
      )
        return;
    }
    setLoading(nextStatus);
    try {
      const res = await fetch(`/api/bookings/${bookingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Gagal memperbarui status.");
      toast(`Status diubah menjadi ${statusLabel(nextStatus)}.`);
      const orderId = json.data?.serviceOrderId;
      if (orderId && nextStatus === "ALAT_DITERIMA") {
        router.push(`/admin/work-orders/${orderId}`);
        return;
      }
      setChoice("");
      router.refresh();
    } catch (err) {
      toast(err instanceof Error ? err.message : "Terjadi kesalahan.");
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="panel p-4 sm:p-5">
      <h2 className="font-display text-base font-bold text-white">Aksi Booking</h2>
      <p className="mt-1 text-xs text-slate-500">
        Status saat ini:{" "}
        <span className="font-semibold text-slate-300">
          {statusLabel(status)}
        </span>
      </p>

      <div className="mt-4 space-y-2.5">
        {canUpdate && allowed.length ? (
          <>
            <label htmlFor="next-status" className="label-dark">
              Ubah status ke
            </label>
            <select
              id="next-status"
              className="input-dark"
              value={choice}
              onChange={(event) => setChoice(event.target.value)}
            >
              <option value="">Pilih status tujuan...</option>
              {allowed.map((next) => (
                <option key={next} value={next}>
                  {statusLabel(next)}
                </option>
              ))}
            </select>
            <button
              type="button"
              disabled={!choice || loading !== null}
              onClick={() => choice && update(choice)}
              className="btn-primary w-full"
            >
              {loading ? (
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-ink-950/30 border-t-ink-950" />
              ) : (
                <Icon name="check" className="h-4 w-4" />
              )}
              Terapkan Status
            </button>
            {status === "MENUNGGU" ? (
              <button
                type="button"
                disabled={loading !== null}
                onClick={() => update("DIKONFIRMASI")}
                className="btn-white w-full"
              >
                <Icon name="check" className="h-4 w-4" />
                Konfirmasi Booking
              </button>
            ) : null}
          </>
        ) : null}

        {serviceOrderId ? (
          <Link
            href={`/admin/work-orders/${serviceOrderId}`}
            className="btn-white w-full"
          >
            <Icon name="wrench" className="h-4 w-4" />
            Buka Work Order
          </Link>
        ) : canCreateOrder ? (
          <Link
            href={`/admin/work-orders?new=1&bookingId=${bookingId}`}
            className="btn-white w-full"
          >
            <Icon name="wrench" className="h-4 w-4" />
            Buat Work Order
          </Link>
        ) : null}

        {canUpdate && canCancel ? (
          <button
            type="button"
            disabled={loading !== null}
            onClick={() => update("DIBATALKAN")}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-rose-500/25 px-4 py-2.5 text-sm font-semibold text-rose-300 hover:bg-rose-500/10 disabled:opacity-50"
          >
            <Icon name="x" className="h-4 w-4" />
            Batalkan Booking
          </button>
        ) : null}
      </div>

      <p className="mt-4 border-t border-white/10 pt-3 text-[0.65rem] leading-relaxed text-slate-500">
        Mengubah status ke <strong>Alat Diterima</strong> akan otomatis membuat
        Work Order bila belum ada.
      </p>
    </div>
  );
}
