"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "@/components/toast";
import { AdminPageHeader } from "@/components/admin/page-header";
import { Icon } from "@/components/icons";
import { cn } from "@/lib/utils";

type BusinessSettings = {
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

type SettingsForm = {
  businessName: string;
  tagline: string;
  address: string;
  phone: string;
  whatsapp: string;
  email: string;
  openingHours: string;
  bookingMode: "GRATIS" | "DP_NOMINAL" | "DP_PERSEN";
  dpNominal: string;
  dpPercent: string;
  paymentDeadlineHours: string;
  cancellationPolicy: string;
  invoiceFooter: string;
};

export default function SettingsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<SettingsForm>({
    businessName: "",
    tagline: "",
    address: "",
    phone: "",
    whatsapp: "",
    email: "",
    openingHours: "",
    bookingMode: "GRATIS",
    dpNominal: "",
    dpPercent: "",
    paymentDeadlineHours: "",
    cancellationPolicy: "",
    invoiceFooter: "",
  });

  useEffect(() => {
    loadSettings();
  }, []);

  async function loadSettings() {
    setLoading(true);
    try {
      const res = await fetch("/api/settings", { cache: "no-store" });
      if (!res.ok) throw new Error("Gagal memuat pengaturan");
      const json = await res.json();
      const d = json.data as BusinessSettings;
      setForm({
        businessName: d.businessName || "",
        tagline: d.tagline || "",
        address: d.address || "",
        phone: d.phone || "",
        whatsapp: d.whatsapp || "",
        email: d.email || "",
        openingHours: d.openingHours || "",
        bookingMode: d.bookingMode || "GRATIS",
        dpNominal: String(d.dpNominal ?? 0),
        dpPercent: String(d.dpPercent ?? 0),
        paymentDeadlineHours: String(d.paymentDeadlineHours ?? 0),
        cancellationPolicy: d.cancellationPolicy || "",
        invoiceFooter: d.invoiceFooter || "",
      });
    } catch (err) {
      toast(err instanceof Error ? err.message : "Gagal memuat pengaturan", "error");
    } finally {
      setLoading(false);
    }
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const payload: Record<string, unknown> = {
        businessName: form.businessName,
        tagline: form.tagline,
        address: form.address,
        phone: form.phone,
        whatsapp: form.whatsapp,
        email: form.email,
        openingHours: form.openingHours,
        bookingMode: form.bookingMode,
        dpNominal: Number(form.dpNominal) || 0,
        dpPercent: Number(form.dpPercent) || 0,
        paymentDeadlineHours: Number(form.paymentDeadlineHours) || 0,
        cancellationPolicy: form.cancellationPolicy,
        invoiceFooter: form.invoiceFooter,
      };
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.error || "Gagal menyimpan pengaturan");
      }
      toast("Pengaturan berhasil disimpan.");
      router.refresh();
    } catch (err) {
      toast(err instanceof Error ? err.message : "Gagal menyimpan pengaturan", "error");
    } finally {
      setSaving(false);
    }
  }

  const modeLabels: Record<string, string> = {
    GRATIS: "Gratis (tanpa DP)",
    DP_NOMINAL: "DP Nominal Tetap",
    DP_PERSEN: "DP Persentase",
  };

  if (loading) {
    return (
      <div className="min-h-dvh flex items-center justify-center">
        <div className="grid h-12 w-12 place-items-center rounded-full border-4 border-brass-500/30 border-t-brass-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-dvh">
      <AdminPageHeader
        eyebrow="Insight"
        title="Pengaturan Bisnis"
        description="Konfigurasi nama bengkel, kontak, kebijakan DP, dan informasi invoice."
      />

      <div className="panel overflow-hidden">
        <form onSubmit={handleSave} className="p-4 sm:p-6 space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
              <p className="text-[0.65rem] font-semibold uppercase tracking-wider text-slate-400 mb-2">
                Nama Bisnis
              </p>
              <input
                name="businessName"
                value={form.businessName}
                onChange={(e) => setForm({ ...form, businessName: e.target.value })}
                className="w-full text-sm text-slate-200 bg-transparent border-b border-white/10 focus:border-brass-500 focus:outline-none placeholder-slate-500"
                placeholder="BagusMusik"
              />
            </div>
            <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
              <p className="text-[0.65rem] font-semibold uppercase tracking-wider text-slate-400 mb-2">
                Tagline
              </p>
              <input
                name="tagline"
                value={form.tagline}
                onChange={(e) => setForm({ ...form, tagline: e.target.value })}
                className="w-full text-sm text-slate-200 bg-transparent border-b border-white/10 focus:border-brass-500 focus:outline-none placeholder-slate-500"
                placeholder="Servis & Reparasi Alat Musik"
              />
            </div>
            <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
              <p className="text-[0.65rem] font-semibold uppercase tracking-wider text-slate-400 mb-2">
                Alamat
              </p>
              <textarea
                name="address"
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
                rows={2}
                className="w-full text-sm text-slate-200 bg-transparent border-b border-white/10 focus:border-brass-500 focus:outline-none placeholder-slate-500"
                placeholder="Prov. Jawa Tengah, Kab.Pekalongan, Kec.Kajen, Desa.Tambakroto, Dk.KelapaSawit"
              />
            </div>
            <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
              <p className="text-[0.65rem] font-semibold uppercase tracking-wider text-slate-400 mb-2">
                Telepon
              </p>
              <input
                name="phone"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                type="tel"
                className="w-full text-sm text-slate-200 bg-transparent border-b border-white/10 focus:border-brass-500 focus:outline-none placeholder-slate-500"
                placeholder="085888058830"
              />
            </div>
            <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
              <p className="text-[0.65rem] font-semibold uppercase tracking-wider text-slate-400 mb-2">
                WhatsApp
              </p>
              <input
                name="whatsapp"
                value={form.whatsapp}
                onChange={(e) => setForm({ ...form, whatsapp: e.target.value })}
                type="tel"
                className="w-full text-sm text-slate-200 bg-transparent border-b border-white/10 focus:border-brass-500 focus:outline-none placeholder-slate-500"
                placeholder="085888058830"
              />
            </div>
            <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
              <p className="text-[0.65rem] font-semibold uppercase tracking-wider text-slate-400 mb-2">
                Email
              </p>
              <input
                name="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                type="email"
                className="w-full text-sm text-slate-200 bg-transparent border-b border-white/10 focus:border-brass-500 focus:outline-none placeholder-slate-500"
                placeholder="baguswidagdo117@gamil.com"
              />
            </div>
            <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
              <p className="text-[0.65rem] font-semibold uppercase tracking-wider text-slate-400 mb-2">
                Jam Operasional
              </p>
              <input
                name="openingHours"
                value={form.openingHours}
                onChange={(e) => setForm({ ...form, openingHours: e.target.value })}
                className="w-full text-sm text-slate-200 bg-transparent border-b border-white/10 focus:border-brass-500 focus:outline-none placeholder-slate-500"
                placeholder="Senin - Sabtu, 09.00 - 20.00 WIB"
              />
            </div>
          </div>

          <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
            <p className="text-[0.65rem] font-semibold uppercase tracking-wider text-slate-400 mb-3">
              Kebijakan Pembayaran
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <p className="text-xs font-semibold text-slate-400 mb-1 uppercase tracking-wider">
                  Mode Booking
                </p>
                <select
                  name="bookingMode"
                  value={form.bookingMode}
                  onChange={(e) => setForm({ ...form, bookingMode: e.target.value as any })}
                  className="w-full text-sm text-slate-200 bg-white/[0.03] border border-white/10 rounded-lg px-3 py-2 focus:border-brass-500 focus:outline-none"
                >
                  {Object.entries(modeLabels).map(([key, label]) => (
                    <option key={key} value={key}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-400 mb-1 uppercase tracking-wider">
                  DP Nominal (Rp)
                </p>
                <input
                  name="dpNominal"
                  value={form.dpNominal}
                  onChange={(e) => setForm({ ...form, dpNominal: e.target.value })}
                  type="number"
                  className="w-full text-sm text-slate-200 bg-white/[0.03] border border-white/10 rounded-lg px-3 py-2 focus:border-brass-500 focus:outline-none"
                  placeholder="50000"
                />
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-400 mb-1 uppercase tracking-wider">
                  DP Persen (%)
                </p>
                <input
                  name="dpPercent"
                  value={form.dpPercent}
                  onChange={(e) => setForm({ ...form, dpPercent: e.target.value })}
                  type="number"
                  className="w-full text-sm text-slate-200 bg-white/[0.03] border border-white/10 rounded-lg px-3 py-2 focus:border-brass-500 focus:outline-none"
                  placeholder="30"
                />
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-400 mb-1 uppercase tracking-wider">
                  Batas Waktu Pembayaran (jam)
                </p>
                <input
                  name="paymentDeadlineHours"
                  value={form.paymentDeadlineHours}
                  onChange={(e) => setForm({ ...form, paymentDeadlineHours: e.target.value })}
                  type="number"
                  className="w-full text-sm text-slate-200 bg-white/[0.03] border border-white/10 rounded-lg px-3 py-2 focus:border-brass-500 focus:outline-none"
                  placeholder="24"
                />
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
            <p className="text-[0.65rem] font-semibold uppercase tracking-wider text-slate-400 mb-3">
              Kebijakan & Footer Invoice
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <p className="text-xs font-semibold text-slate-400 mb-1 uppercase tracking-wider">
                  Kebijakan Pembatalan
                </p>
                <textarea
                  name="cancellationPolicy"
                  value={form.cancellationPolicy}
                  onChange={(e) => setForm({ ...form, cancellationPolicy: e.target.value })}
                  rows={3}
                  className="w-full text-sm text-slate-200 bg-white/[0.03] border border-white/10 rounded-lg px-3 py-2 focus:border-brass-500 focus:outline-none placeholder-slate-500"
                  placeholder="Booking gratis dapat dibatalkan kapan saja..."
                />
              </div>
              <div className="sm:col-span-2">
                <p className="text-xs font-semibold text-slate-400 mb-1 uppercase tracking-wider">
                  Footer Invoice
                </p>
                <textarea
                  name="invoiceFooter"
                  value={form.invoiceFooter}
                  onChange={(e) => setForm({ ...form, invoiceFooter: e.target.value })}
                  rows={3}
                  className="w-full text-sm text-slate-200 bg-white/[0.03] border border-white/10 rounded-lg px-3 py-2 focus:border-brass-500 focus:outline-none placeholder-slate-500"
                  placeholder="Terima kasih telah mempercayakan alat musik Anda kepada BagusMusik."
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-4">
            <button
              type="submit"
              disabled={saving}
              className={cn(
                "inline-flex items-center gap-2 rounded-xl bg-brass-500 px-5 py-2.5 text-sm font-bold text-ink-950 hover:bg-brass-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors",
              )}
            >
              {saving ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-ink-950/30 border-t-ink-950" />
                  Menyimpan...
                </>
              ) : (
                <>
                  <Icon name="check" className="h-4 w-4" />
                  Simpan Pengaturan
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
