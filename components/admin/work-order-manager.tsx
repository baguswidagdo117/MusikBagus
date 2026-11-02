"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  INSTRUMENTS,
  SERVICE_ORDER_TRANSITIONS,
  statusLabel,
} from "@/lib/status";
import { cn, formatIDR } from "@/lib/utils";
import { toast } from "../toast";
import { Icon } from "../icons";

type Item = {
  id: string;
  type: string;
  description: string;
  qty: number;
  unitPrice: number;
  subtotal: number;
};

export function WorkOrderManager({
  order,
  technicians,
  services,
  inventory,
  items,
  canUpdate,
  canManageFinance,
  canAssign,
}: {
  order: {
    id: string;
    status: string;
    instrumentType: string;
    brand: string | null;
    model: string | null;
    serialNumber: string | null;
    initialCondition: string | null;
    diagnosis: string | null;
    technicianNotes: string | null;
    estimatedDone: string | null;
    serviceFee: number;
    estimateCost: number;
    technicianId: string | null;
    beforePhoto: string | null;
    afterPhoto: string | null;
    updatedAt: string;
  };
  technicians: { id: string; name: string }[];
  services: { id: string; name: string; price: number }[];
  inventory: {
    id: string;
    name: string;
    sellPrice: number;
    stock: number;
    unit: string;
  }[];
  items: Item[];
  canUpdate: boolean;
  canManageFinance: boolean;
  canAssign: boolean;
}) {
  const router = useRouter();
  const [status, setStatus] = useState("");
  const [savingStatus, setSavingStatus] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState<"before" | "after" | null>(null);
  const [itemType, setItemType] = useState<"JASA" | "PART">("JASA");
  const [addingItem, setAddingItem] = useState(false);
  const beforeRef = useRef<HTMLInputElement>(null);
  const afterRef = useRef<HTMLInputElement>(null);

  const allowed = (SERVICE_ORDER_TRANSITIONS[order.status] ?? []).filter(
    (next) => next !== "CANCELLED" || canManageFinance,
  );

  async function patch(payload: Record<string, unknown>, successMessage: string) {
    const res = await fetch(`/api/service-orders/${order.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || "Gagal menyimpan.");
    toast(successMessage);
    router.refresh();
  }

  async function applyStatus(next: string) {
    if (
      next === "CANCELLED" &&
      !window.confirm("Batalkan work order ini? Stok part akan dikembalikan.")
    )
      return;
    setSavingStatus(true);
    try {
      await patch({ status: next }, `Status diubah: ${statusLabel(next, "order")}`);
      setStatus("");
    } catch (err) {
      toast(err instanceof Error ? err.message : "Gagal mengubah status.");
    } finally {
      setSavingStatus(false);
    }
  }

  async function saveDetails(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const payload: Record<string, unknown> = {
      instrumentType: String(form.get("instrumentType") || ""),
      brand: String(form.get("brand") || ""),
      model: String(form.get("model") || ""),
      serialNumber: String(form.get("serialNumber") || ""),
      initialCondition: String(form.get("initialCondition") || ""),
      diagnosis: String(form.get("diagnosis") || ""),
      technicianNotes: String(form.get("technicianNotes") || ""),
      estimatedDone: String(form.get("estimatedDone") || ""),
    };
    if (canAssign) {
      payload.technicianId = String(form.get("technicianId") || "");
    }
    if (canManageFinance) {
      payload.serviceFee = Number(form.get("serviceFee") || 0);
      payload.estimateCost = Number(form.get("estimateCost") || 0);
    }
    setSaving(true);
    try {
      await patch(payload, "Detail work order disimpan.");
    } catch (err) {
      toast(err instanceof Error ? err.message : "Gagal menyimpan.");
    } finally {
      setSaving(false);
    }
  }

  async function uploadPhoto(kind: "before" | "after", file: File) {
    setUploading(kind);
    try {
      const body = new FormData();
      body.append("file", file);
      const upload = await fetch("/api/upload", { method: "POST", body });
      const uploaded = await upload.json();
      if (!upload.ok) throw new Error(uploaded.error || "Upload gagal.");
      await patch(
        { [kind === "before" ? "beforePhoto" : "afterPhoto"]: uploaded.data.url },
        "Foto diperbarui.",
      );
    } catch (err) {
      toast(err instanceof Error ? err.message : "Upload gagal.");
    } finally {
      setUploading(null);
      if (beforeRef.current) beforeRef.current.value = "";
      if (afterRef.current) afterRef.current.value = "";
    }
  }

  async function addItem(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formEl = event.currentTarget;
    const form = new FormData(formEl);
    const rawPrice = String(form.get("unitPrice") || "").trim();
    const payload = {
      type: itemType,
      serviceId: itemType === "JASA" ? String(form.get("serviceId") || "") : "",
      inventoryId:
        itemType === "PART" ? String(form.get("inventoryId") || "") : "",
      description: String(form.get("description") || ""),
      qty: Number(form.get("qty") || 1),
      unitPrice: rawPrice ? Number(rawPrice) : undefined,
    };
    setAddingItem(true);
    try {
      const res = await fetch(`/api/service-orders/${order.id}/items`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Gagal menambah item.");
      toast("Item ditambahkan.");
      formEl.reset();
      router.refresh();
    } catch (err) {
      toast(err instanceof Error ? err.message : "Gagal menambah item.");
    } finally {
      setAddingItem(false);
    }
  }

  async function deleteItem(itemId: string) {
    if (!window.confirm("Hapus item ini? Stok part akan dikembalikan.")) return;
    try {
      const res = await fetch(
        `/api/service-orders/${order.id}/items/${itemId}`,
        { method: "DELETE" },
      );
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Gagal menghapus item.");
      toast("Item dihapus.");
      router.refresh();
    } catch (err) {
      toast(err instanceof Error ? err.message : "Gagal menghapus item.");
    }
  }

  return (
    <div className="space-y-4">
      <section className="panel p-4 sm:p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="font-display text-base font-bold text-white">
              Status Pengerjaan
            </h2>
            <p className="mt-0.5 text-xs text-slate-500">
              Status saat ini:{" "}
              <span className="font-semibold text-slate-300">
                {statusLabel(order.status, "order")}
              </span>
            </p>
          </div>
          {allowed.length ? (
            <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto">
              <select
                className="select-dark min-w-0 flex-1 sm:w-56"
                value={status}
                onChange={(event) => setStatus(event.target.value)}
              >
                <option value="">Ubah status...</option>
                {allowed.map((next) => (
                  <option key={next} value={next}>
                    {statusLabel(next, "order")}
                  </option>
                ))}
              </select>
              <button
                type="button"
                disabled={!status || savingStatus}
                onClick={() => status && applyStatus(status)}
                className="btn-primary"
              >
                {savingStatus ? (
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-ink-950/30 border-t-ink-950" />
                ) : (
                  <Icon name="check" className="h-4 w-4" />
                )}
                Terapkan
              </button>
            </div>
          ) : (
            <span className="text-xs text-slate-500">
              Status final — tidak ada transisi.
            </span>
          )}
        </div>
      </section>

      <section className="panel p-4 sm:p-5">
        <h2 className="font-display text-base font-bold text-white">
          Detail Pengerjaan
        </h2>
        <form
          key={order.updatedAt}
          onSubmit={saveDetails}
          className="mt-4 space-y-4"
        >
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label htmlFor="wo-instrument" className="label-dark">
                Instrumen
              </label>
              <select
                id="wo-instrument"
                name="instrumentType"
                className="select-dark"
                defaultValue={order.instrumentType}
                disabled={!canUpdate}
              >
                {!INSTRUMENTS.includes(
                  order.instrumentType as (typeof INSTRUMENTS)[number],
                ) ? (
                  <option value={order.instrumentType}>
                    {order.instrumentType}
                  </option>
                ) : null}
                {INSTRUMENTS.map((instrument) => (
                  <option key={instrument} value={instrument}>
                    {instrument}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="wo-technician" className="label-dark">
                Teknisi
              </label>
              {canAssign ? (
                <select
                  id="wo-technician"
                  name="technicianId"
                  className="select-dark"
                  defaultValue={order.technicianId ?? ""}
                >
                  <option value="">Belum ditugaskan</option>
                  {technicians.map((technician) => (
                    <option key={technician.id} value={technician.id}>
                      {technician.name}
                    </option>
                  ))}
                </select>
              ) : (
                <p className="input-dark flex items-center text-sm text-slate-400">
                  {technicians.find((t) => t.id === order.technicianId)?.name ??
                    "Belum ditugaskan"}
                </p>
              )}
            </div>
            <div>
              <label htmlFor="wo-brand" className="label-dark">
                Merek
              </label>
              <input
                id="wo-brand"
                name="brand"
                className="input-dark"
                defaultValue={order.brand ?? ""}
                disabled={!canUpdate}
              />
            </div>
            <div>
              <label htmlFor="wo-model" className="label-dark">
                Model
              </label>
              <input
                id="wo-model"
                name="model"
                className="input-dark"
                defaultValue={order.model ?? ""}
                disabled={!canUpdate}
              />
            </div>
            <div>
              <label htmlFor="wo-serial" className="label-dark">
                Nomor seri
              </label>
              <input
                id="wo-serial"
                name="serialNumber"
                className="input-dark"
                defaultValue={order.serialNumber ?? ""}
                disabled={!canUpdate}
              />
            </div>
            <div>
              <label htmlFor="wo-date" className="label-dark">
                Estimasi selesai
              </label>
              <input
                id="wo-date"
                name="estimatedDone"
                type="date"
                className="input-dark"
                defaultValue={order.estimatedDone?.slice(0, 10) ?? ""}
                disabled={!canUpdate}
              />
            </div>
          </div>

          <div>
            <label htmlFor="wo-condition" className="label-dark">
              Kondisi awal alat
            </label>
            <textarea
              id="wo-condition"
              name="initialCondition"
              className="textarea-dark min-h-16"
              defaultValue={order.initialCondition ?? ""}
              disabled={!canUpdate}
              placeholder="Kondisi saat diterima..."
            />
          </div>
          <div>
            <label htmlFor="wo-diagnosis" className="label-dark">
              Diagnosis
            </label>
            <textarea
              id="wo-diagnosis"
              name="diagnosis"
              className="textarea-dark min-h-20"
              defaultValue={order.diagnosis ?? ""}
              disabled={!canUpdate}
              placeholder="Hasil pemeriksaan teknisi..."
            />
          </div>
          <div>
            <label htmlFor="wo-notes" className="label-dark">
              Catatan teknisi
            </label>
            <textarea
              id="wo-notes"
              name="technicianNotes"
              className="textarea-dark min-h-16"
              defaultValue={order.technicianNotes ?? ""}
              disabled={!canUpdate}
              placeholder="Catatan internal / rekomendasi..."
            />
          </div>

          {canManageFinance ? (
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label htmlFor="wo-fee" className="label-dark">
                  Biaya jasa (Rp)
                </label>
                <input
                  id="wo-fee"
                  name="serviceFee"
                  type="number"
                  min={0}
                  step={1000}
                  className="input-dark"
                  defaultValue={order.serviceFee}
                  disabled={!canUpdate}
                />
              </div>
              <div>
                <label htmlFor="wo-estimate" className="label-dark">
                  Estimasi total (Rp)
                </label>
                <input
                  id="wo-estimate"
                  name="estimateCost"
                  type="number"
                  min={0}
                  step={1000}
                  className="input-dark"
                  defaultValue={order.estimateCost}
                  disabled={!canUpdate}
                />
              </div>
            </div>
          ) : null}

          {canUpdate ? (
            <div className="flex justify-end">
              <button type="submit" disabled={saving} className="btn-primary">
                {saving ? (
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-ink-950/30 border-t-ink-950" />
                ) : (
                  <Icon name="check" className="h-4 w-4" />
                )}
                Simpan Perubahan
              </button>
            </div>
          ) : null}
        </form>
      </section>

      <section className="panel p-4 sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="font-display text-base font-bold text-white">
              Item Pekerjaan
            </h2>
            <p className="text-xs text-slate-500">
              Jasa dan spare part yang dipakai
            </p>
          </div>
          <p className="text-sm font-semibold text-brass-300">
            {formatIDR(items.reduce((sum, item) => sum + item.subtotal, 0))}
          </p>
        </div>

        {items.length ? (
          <ul className="mt-3 divide-y divide-white/5">
            {items.map((item) => (
              <li key={item.id} className="flex items-start gap-3 py-2.5">
                <span
                  className={cn(
                    "mt-0.5 rounded px-1.5 py-0.5 text-[0.6rem] font-bold uppercase",
                    item.type === "PART"
                      ? "bg-sky-500/10 text-sky-300"
                      : "bg-emerald-500/10 text-emerald-300",
                  )}
                >
                  {item.type}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-slate-200">{item.description}</p>
                  <p className="text-[0.65rem] text-slate-500">
                    {item.qty} × {formatIDR(item.unitPrice)}
                  </p>
                </div>
                <p className="text-sm font-medium text-slate-200">
                  {formatIDR(item.subtotal)}
                </p>
                {canUpdate ? (
                  <button
                    type="button"
                    onClick={() => deleteItem(item.id)}
                    className="grid h-8 w-8 place-items-center rounded-lg text-slate-500 hover:bg-rose-500/10 hover:text-rose-300"
                    aria-label="Hapus item"
                  >
                    <Icon name="trash" className="h-3.5 w-3.5" />
                  </button>
                ) : null}
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-3 rounded-lg border border-dashed border-white/10 p-4 text-center text-xs text-slate-500">
            Belum ada item pekerjaan.
          </p>
        )}

        {canUpdate ? (
          <form
            onSubmit={addItem}
            className="mt-4 rounded-xl border border-white/10 bg-white/[0.02] p-3"
          >
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setItemType("JASA")}
                className={cn(
                  "rounded-lg px-3 py-1.5 text-xs font-semibold",
                  itemType === "JASA"
                    ? "bg-brass-500 text-ink-950"
                    : "bg-white/5 text-slate-400",
                )}
              >
                Jasa
              </button>
              <button
                type="button"
                onClick={() => setItemType("PART")}
                className={cn(
                  "rounded-lg px-3 py-1.5 text-xs font-semibold",
                  itemType === "PART"
                    ? "bg-brass-500 text-ink-950"
                    : "bg-white/5 text-slate-400",
                )}
              >
                Spare Part
              </button>
            </div>

            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              {itemType === "JASA" ? (
                <div className="sm:col-span-2">
                  <select name="serviceId" className="select-dark" defaultValue="">
                    <option value="">Pilih layanan (opsional)...</option>
                    {services.map((service) => (
                      <option key={service.id} value={service.id}>
                        {service.name} · {formatIDR(service.price)}
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <div className="sm:col-span-2">
                  <select
                    name="inventoryId"
                    className="select-dark"
                    required
                    defaultValue=""
                  >
                    <option value="">Pilih spare part...</option>
                    {inventory.map((part) => (
                      <option key={part.id} value={part.id}>
                        {part.name} · stok {part.stock} {part.unit} ·{" "}
                        {formatIDR(part.sellPrice)}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              <div className="sm:col-span-2">
                <input
                  name="description"
                  className="input-dark"
                  placeholder="Deskripsi item (opsional)"
                />
              </div>
              <input
                name="qty"
                type="number"
                min={1}
                defaultValue={1}
                className="input-dark"
                aria-label="Qty"
              />
              <input
                name="unitPrice"
                type="number"
                min={0}
                step={1000}
                className="input-dark"
                placeholder="Harga (opsional)"
                aria-label="Harga satuan"
              />
            </div>
            <div className="mt-2 flex justify-end">
              <button
                type="submit"
                disabled={addingItem}
                className="btn-white btn-sm"
              >
                {addingItem ? (
                  <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                ) : (
                  <Icon name="plus" className="h-3.5 w-3.5" />
                )}
                Tambah Item
              </button>
            </div>
          </form>
        ) : null}
      </section>

      <section className="panel p-4 sm:p-5">
        <h2 className="font-display text-base font-bold text-white">
          Dokumentasi Foto
        </h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          {(["before", "after"] as const).map((kind) => {
            const url = kind === "before" ? order.beforePhoto : order.afterPhoto;
            return (
              <div
                key={kind}
                className="rounded-xl border border-white/10 bg-white/[0.02] p-3"
              >
                <p className="text-xs font-semibold text-slate-300">
                  {kind === "before" ? "Sebelum servis" : "Setelah servis"}
                </p>
                <div className="mt-2 grid h-32 place-items-center overflow-hidden rounded-lg bg-white/5">
                  {url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={url}
                      alt={kind === "before" ? "Foto sebelum" : "Foto setelah"}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <Icon name="camera" className="h-6 w-6 text-slate-600" />
                  )}
                </div>
                {canUpdate ? (
                  <>
                    <input
                      ref={kind === "before" ? beforeRef : afterRef}
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      className="hidden"
                      onChange={(event) => {
                        const file = event.target.files?.[0];
                        if (file) uploadPhoto(kind, file);
                      }}
                    />
                    <button
                      type="button"
                      disabled={uploading !== null}
                      onClick={() =>
                        (kind === "before"
                          ? beforeRef.current
                          : afterRef.current
                        )?.click()
                      }
                      className="btn-white btn-sm mt-2 w-full"
                    >
                      {uploading === kind ? (
                        <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                      ) : (
                        <Icon name="upload" className="h-3.5 w-3.5" />
                      )}
                      {url ? "Ganti Foto" : "Upload Foto"}
                    </button>
                  </>
                ) : null}
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
