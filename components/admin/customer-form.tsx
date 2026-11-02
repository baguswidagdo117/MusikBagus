"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Modal } from "../modal";
import { toast } from "../toast";
import { Icon } from "../icons";

type Customer = {
  id: string;
  name: string;
  whatsapp: string;
  email: string | null;
  address: string | null;
  notes: string | null;
};

export function CustomerFormDialog({
  customer,
  label,
  variant = "primary",
}: {
  customer?: Customer;
  label?: string;
  variant?: "primary" | "white";
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const editing = Boolean(customer);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    const form = new FormData(event.currentTarget);
    const payload = {
      name: String(form.get("name") || ""),
      whatsapp: String(form.get("whatsapp") || ""),
      email: String(form.get("email") || ""),
      address: String(form.get("address") || ""),
      notes: String(form.get("notes") || ""),
    };
    setLoading(true);
    try {
      const res = await fetch(
        editing ? `/api/customers/${customer!.id}` : "/api/customers",
        {
          method: editing ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Gagal menyimpan pelanggan.");
      toast(editing ? "Data pelanggan diperbarui." : "Pelanggan ditambahkan.");
      setOpen(false);
      if (!editing) {
        router.push(`/admin/customers/${json.data.id}`);
      }
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={variant === "white" ? "btn-white" : "btn-primary"}
      >
        <Icon name={editing ? "edit" : "plus"} className="h-4 w-4" />
        {label ?? (editing ? "Edit Pelanggan" : "Pelanggan Baru")}
      </button>
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={editing ? "Edit Pelanggan" : "Pelanggan Baru"}
        description="Data pelanggan membantu riwayat servis dan transaksi."
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
              form="customer-form"
              disabled={loading}
              className="btn-primary"
            >
              {loading ? (
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-ink-950/30 border-t-ink-950" />
              ) : (
                <Icon name="check" className="h-4 w-4" />
              )}
              Simpan
            </button>
          </div>
        }
      >
        <form id="customer-form" onSubmit={onSubmit} className="space-y-3">
          <div>
            <label htmlFor="cust-name" className="label-dark">
              Nama lengkap *
            </label>
            <input
              id="cust-name"
              name="name"
              className="input-dark"
              defaultValue={customer?.name ?? ""}
              required
              minLength={2}
            />
          </div>
          <div>
            <label htmlFor="cust-wa" className="label-dark">
              WhatsApp *
            </label>
            <input
              id="cust-wa"
              name="whatsapp"
              className="input-dark"
              defaultValue={customer?.whatsapp ?? ""}
              placeholder="08xxxxxxxxxx"
              required
              minLength={8}
            />
          </div>
          <div>
            <label htmlFor="cust-email" className="label-dark">
              Email
            </label>
            <input
              id="cust-email"
              name="email"
              type="email"
              className="input-dark"
              defaultValue={customer?.email ?? ""}
            />
          </div>
          <div>
            <label htmlFor="cust-address" className="label-dark">
              Alamat
            </label>
            <textarea
              id="cust-address"
              name="address"
              className="textarea-dark min-h-16"
              defaultValue={customer?.address ?? ""}
            />
          </div>
          <div>
            <label htmlFor="cust-notes" className="label-dark">
              Catatan
            </label>
            <textarea
              id="cust-notes"
              name="notes"
              className="textarea-dark min-h-16"
              defaultValue={customer?.notes ?? ""}
            />
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
