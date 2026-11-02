"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "@/components/toast";
import { AdminPageHeader } from "@/components/admin/page-header";
import { Icon } from "@/components/icons";

export default function UserNewPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "KASIR",
    phone: "",
  });

  const ROLES = [
    { value: "OWNER", label: "Owner" },
    { value: "ADMIN", label: "Admin" },
    { value: "KASIR", label: "Kasir" },
    { value: "TEKNISI", label: "Teknisi" },
  ];

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = {
        name: formData.name,
        email: formData.email.toLowerCase(),
        password: formData.password,
        role: formData.role,
        phone: formData.phone || undefined,
      };
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Gagal menambahkan pengguna.");
      toast("Pengguna berhasil ditambahkan.");
      router.push(`/admin/users/${json.data.id}`);
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
          href="/admin/users"
          className="inline-flex items-center gap-1 font-semibold text-slate-400 hover:text-white"
        >
          <Icon name="arrow-left" className="h-3.5 w-3.5" />
          Pengguna
        </Link>
        <span>/</span>
        <span className="font-mono text-slate-400">Tambah Pengguna</span>
      </div>

      <AdminPageHeader
        title="Tambah Pengguna"
        description="Buat akun staf baru dengan peran dan hak akses (RBAC)."
      />

      <div className="panel overflow-hidden p-4 sm:p-6 max-w-2xl">
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="label-dark mb-1 block">Nama Lengkap *</label>
            <input
              name="name"
              className="input-dark w-full"
              placeholder="Contoh: Rian Teknisi"
              required
              minLength={2}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>
          <div>
            <label className="label-dark mb-1 block">Email *</label>
            <input
              name="email"
              type="email"
              className="input-dark w-full"
              placeholder="nama@contoh.id"
              required
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
          </div>
          <div>
            <label className="label-dark mb-1 block">Password *</label>
            <input
              name="password"
              type="password"
              className="input-dark w-full"
              placeholder="Minimal 6 karakter"
              required
              minLength={6}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label-dark mb-1 block">Peran *</label>
              <select
                name="role"
                className="input-dark w-full"
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              >
                {ROLES.map((r) => (
                  <option key={r.value} value={r.value}>
                    {r.label}
                  </option>
                ))}
              </select>
            </div>
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
          </div>

          <div className="mt-6 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => router.push("/admin/users")}
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
              Simpan Pengguna
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
