"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "@/components/toast";
import { AdminPageHeader } from "@/components/admin/page-header";
import { Icon } from "@/components/icons";
import { cn } from "@/lib/utils";

export default function InventoryNewPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    sku: "",
    name: "",
    category: "",
    supplierId: "",
    purchasePrice: "",
    sellPrice: "",
    stock: "0",
    minStock: "2",
    unit: "pcs",
  });

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = {
        sku: formData.sku,
        name: formData.name,
        category: formData.category,
        supplierId: formData.supplierId || null,
        purchasePrice: Number(formData.purchasePrice) || 0,
        sellPrice: Number(formData.sellPrice) || 0,
        stock: Number(formData.stock) || 0,
        minStock: Number(formData.minStock) || 2,
        unit: formData.unit || "pcs",
      };
      const res = await fetch("/api/inventory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Gagal menambahkan barang.");
      toast("Barang berhasil ditambahkan.");
      router.push(`/admin/inventory/${json.data.id}`);
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
          href="/admin/inventory"
          className="inline-flex items-center gap-1 font-semibold text-slate-400 hover:text-white"
        >
          <Icon name="arrow-left" className="h-3.5 w-3.5" />
          Inventaris
        </Link>
        <span>/</span>
        <span className="font-mono text-slate-400">Tambah Barang</span>
      </div>

      <AdminPageHeader
        title="Tambah Barang Inventaris"
        description="Isi data spare part atau bahan pakai baru."
      />

      <div className="panel overflow-hidden p-4 sm:p-6 max-w-2xl">
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label-dark mb-1 block">
                SKU *
              </label>
              <input
                name="sku"
                className="input-dark w-full"
                placeholder="Contoh: SP-001"
                required
                minLength={2}
                onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
              />
            </div>
            <div>
              <label className="label-dark mb-1 block">
                Nama Barang *
              </label>
              <input
                name="name"
                className="input-dark w-full"
                placeholder="Contoh: Senar Gitar Elixir 010"
                required
                minLength={2}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div>
              <label className="label-dark mb-1 block">
                Kategori *
              </label>
              <input
                name="category"
                className="input-dark w-full"
                placeholder="Contoh: Senar, Elektronik, Kabel"
                required
                minLength={2}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              />
            </div>
            <div>
              <label className="label-dark mb-1 block">
                Supplier
              </label>
              <select
                name="supplierId"
                className="input-dark w-full"
                onChange={(e) => setFormData({ ...formData, supplierId: e.target.value })}
              >
                <option value="">Tidak ada supplier</option>
              </select>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label-dark mb-1 block">
                Harga Beli (Rp)
              </label>
              <input
                name="purchasePrice"
                type="number"
                min="0"
                className="input-dark w-full"
                placeholder="0"
                onChange={(e) => setFormData({ ...formData, purchasePrice: e.target.value })}
              />
            </div>
            <div>
              <label className="label-dark mb-1 block">
                Harga Jual (Rp)
              </label>
              <input
                name="sellPrice"
                type="number"
                min="0"
                className="input-dark w-full"
                placeholder="0"
                required
                onChange={(e) => setFormData({ ...formData, sellPrice: e.target.value })}
              />
            </div>
            <div>
              <label className="label-dark mb-1 block">
                Stok Awal
              </label>
              <input
                name="stock"
                type="number"
                min="0"
                defaultValue="0"
                className="input-dark w-full"
                onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
              />
            </div>
            <div>
              <label className="label-dark mb-1 block">
                Stok Minimum
              </label>
              <input
                name="minStock"
                type="number"
                min="0"
                defaultValue="2"
                className="input-dark w-full"
                onChange={(e) => setFormData({ ...formData, minStock: e.target.value })}
              />
            </div>
            <div>
              <label className="label-dark mb-1 block">
                Satuan
              </label>
              <input
                name="unit"
                className="input-dark w-full"
                defaultValue="pcs"
                onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
              />
            </div>
          </div>

          <div className="mt-6 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => router.push("/admin/inventory")}
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
              Simpan Barang
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
