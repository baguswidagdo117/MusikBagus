"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "@/components/toast";
import { AdminPageHeader } from "@/components/admin/page-header";
import { Icon } from "@/components/icons";

export default function ServiceNewPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    code: "",
    name: "",
    category: "",
    description: "",
    price: "",
    durationMin: "60",
    active: "true",
  });

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = {
        code: formData.code,
        name: formData.name,
        category: formData.category,
        description: formData.description || undefined,
        price: Number(formData.price) || 0,
        durationMin: Number(formData.durationMin) || 60,
        active: formData.active === "true",
      };
      const res = await fetch("/api/services", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Gagal menambahkan layanan.");
      toast("Layanan berhasil ditambahkan.");
      router.push(`/admin/services/${json.data.id}`);
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
          href="/admin/services"
          className="inline-flex items-center gap-1 font-semibold text-slate-400 hover:text-white"
        >
          <Icon name="arrow-left" className="h-3.5 w-3.5" />
          Layanan
        </Link>
        <span>/</span>
        <span className="font-mono text-slate-400">Tambah Layanan</span>
      </div>

      <AdminPageHeader
        title="Tambah Layanan Servis"
        description="Isi data layanan baru beserta harga dan durasi estimasi."
      />

      <div className="panel overflow-hidden p-4 sm:p-6 max-w-2xl">
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label-dark mb-1 block">Kode Layanan *</label>
              <input
                name="code"
                className="input-dark w-full font-mono"
                placeholder="Contoh: SRV-SETUP"
                required
                minLength={2}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
              />
            </div>
            <div>
              <label className="label-dark mb-1 block">Nama Layanan *</label>
              <input
                name="name"
                className="input-dark w-full"
                placeholder="Contoh: Setup & Adjustment"
                required
                minLength={2}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div>
              <label className="label-dark mb-1 block">Kategori *</label>
              <input
                name="category"
                className="input-dark w-full"
                placeholder="Contoh: Setup, Perawatan, Elektronik"
                required
                minLength={2}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              />
            </div>
            <div>
              <label className="label-dark mb-1 block">Harga (Rp) *</label>
              <input
                name="price"
                type="number"
                min="0"
                className="input-dark w-full"
                placeholder="150000"
                required
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
              />
            </div>
            <div>
              <label className="label-dark mb-1 block">Durasi (menit) *</label>
              <input
                name="durationMin"
                type="number"
                min="5"
                defaultValue="60"
                className="input-dark w-full"
                onChange={(e) => setFormData({ ...formData, durationMin: e.target.value })}
              />
            </div>
          </div>
          <div>
            <label className="label-dark mb-1 block">Deskripsi</label>
            <textarea
              name="description"
              className="textarea-dark w-full min-h-16"
              placeholder="Deskripsi layanan..."
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>
          <div className="flex items-center gap-2">
            <input
              name="active"
              type="checkbox"
              checked={formData.active === "true"}
              onChange={(e) =>
                setFormData({ ...formData, active: e.target.checked ? "true" : "false" })
              }
              className="accent-brass-500"
            />
            <label className="text-sm text-slate-300">Layanan aktif (ditampilkan di katalog)</label>
          </div>

          <div className="mt-6 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => router.push("/admin/services")}
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
              Simpan Layanan
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
