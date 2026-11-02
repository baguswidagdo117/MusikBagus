"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "@/components/toast";
import { AdminPageHeader } from "@/components/admin/page-header";
import { Icon } from "@/components/icons";

export default function SupplierNewPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    contact: "",
    phone: "",
    email: "",
    address: "",
  });

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = {
        name: formData.name,
        contact: formData.contact || undefined,
        phone: formData.phone || undefined,
        email: formData.email || undefined,
        address: formData.address || undefined,
      };
      const res = await fetch("/api/suppliers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Gagal menambahkan supplier.");
      toast("Supplier berhasil ditambahkan.");
      router.push(`/admin/suppliers/${json.data.id}`);
      router.refresh();
    } catch (err) {
      toast(err instanceof Error ? err.message : "Terjadi kesalahan.", "error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-2 text-xs text-slate-500">
        <Link
          href="/admin/suppliers"
          className="inline-flex items-center gap-1 font-semibold text-slate-400 hover:text-white"
        >
          <Icon name="arrow-left" className="h-3.5 w-3.5" />
          Supplier
        </Link>
        <span>/</span>
        <span className="font-mono text-slate-400">Tambah Supplier</span>
      </div>

      <AdminPageHeader
        title="Tambah Supplier"
        description="Isi data pemasok spare part dan bahan baku."
      />

      <div className="panel overflow-hidden p-4 sm:p-6 max-w-2xl">
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="label-dark mb-1 block">Nama Supplier *</label>
            <input
              name="name"
              className="input-dark w-full"
              placeholder="Contoh: CV Nada Jaya"
              required
              minLength={2}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>
          <div>
            <label className="label-dark mb-1 block">Kontak Person</label>
            <input
              name="contact"
              className="input-dark w-full"
              placeholder="Contoh: Hendra"
              onChange={(e) => setFormData({ ...formData, contact: e.target.value })}
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label-dark mb-1 block">Telepon</label>
              <input
                name="phone"
                type="tel"
                className="input-dark w-full"
                placeholder="08xxxxxxxxxx"
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>
            <div>
              <label className="label-dark mb-1 block">Email</label>
              <input
                name="email"
                type="email"
                className="input-dark w-full"
                placeholder="sales@contoh.id"
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>
          </div>
          <div>
            <label className="label-dark mb-1 block">Alamat</label>
            <textarea
              name="address"
              className="textarea-dark w-full min-h-16"
              placeholder="Jl. Contoh No. 1, Kota"
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            />
          </div>

          <div className="mt-6 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => router.push("/admin/suppliers")}
              className="btn-ghost-dark"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={loading}
              className="btn-primary"
            >
              {loading ? (
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-ink-950/30 border-t-ink-950" />
              ) : (
                <Icon name="check" className="h-4 w-4" />
              )}
              Simpan Supplier
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
