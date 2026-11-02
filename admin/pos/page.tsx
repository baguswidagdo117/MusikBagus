"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { toast } from "@/components/toast";
import { AdminPageHeader } from "@/components/admin/page-header";
import { Icon } from "@/components/icons";
import { PAYMENT_METHODS } from "@/lib/status";
import { formatIDR, cn } from "@/lib/utils";

type InventoryItem = {
  id: string;
  name: string;
  sku: string;
  category: string;
  stock: number;
  sellPrice: number;
  unit: string;
};

type ServiceItem = {
  id: string;
  name: string;
  code: string;
  category: string;
  price: number;
};

type Customer = {
  id: string;
  name: string;
  whatsapp: string;
  code: string;
};

type PosItem = {
  id: string;
  type: "JASA" | "PART" | "LAINNYA";
  description: string;
  qty: number;
  unitPrice: number;
  subtotal: number;
  inventoryId?: string;
  serviceId?: string;
};

export default function PosPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [items, setItems] = useState<PosItem[]>([]);
  const [discount, setDiscount] = useState(0);
  const [dpAmount, setDpAmount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState("CASH");
  const [serviceOrderId, setServiceOrderId] = useState<string | null>(null);

  const subtotal = items.reduce((sum, i) => sum + i.subtotal, 0);
  const total = Math.max(0, subtotal - discount);
  const paid = dpAmount;
  const remaining = Math.max(0, total - paid);
  const paymentStatus = paid <= 0 ? "UNPAID" : paid >= total ? "PAID" : "PARTIAL";

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      const [cRes, iRes, sRes] = await Promise.all([
        fetch("/api/customers?perPage=200", { cache: "no-store" }),
        fetch("/api/inventory?perPage=200", { cache: "no-store" }),
        fetch("/api/services?perPage=200", { cache: "no-store" }),
      ]);
      const customersData = await cRes.json();
      const inventoryData = await iRes.json();
      const servicesData = await sRes.json();
      setCustomers(customersData.data?.items ?? []);
      setInventory(inventoryData.data?.items ?? []);
      setServices(servicesData.data ?? []);
    } catch (err) {
      toast("Gagal memuat data POS", "error");
    } finally {
      setLoading(false);
    }
  }

  const addItem = useCallback((type: "JASA" | "PART" | "LAINNYA", source: ServiceItem | InventoryItem | null, customDesc?: string, customPrice?: number) => {
    if (!source) {
      // Manual item
      const desc = customDesc || "Item Lainnya";
      const price = customPrice ?? 0;
      const newItem: PosItem = {
        id: Date.now().toString(),
        type,
        description: desc,
        qty: 1,
        unitPrice: price,
        subtotal: price,
      };
      setItems((prev) => [...prev, newItem]);
      return;
    }

    if (type === "PART" && source) {
      const inv = source as InventoryItem;
      if (inv.stock <= 0) {
        toast("Stok tidak mencukupi", "error");
        return;
      }
      const newItem: PosItem = {
        id: Date.now().toString(),
        type: "PART",
        description: inv.name,
        qty: 1,
        unitPrice: inv.sellPrice,
        subtotal: inv.sellPrice,
        inventoryId: inv.id,
      };
      setItems((prev) => [...prev, newItem]);
    } else if (type === "JASA" && source) {
      const svc = source as ServiceItem;
      const newItem: PosItem = {
        id: Date.now().toString(),
        type: "JASA",
        description: svc.name,
        qty: 1,
        unitPrice: svc.price,
        subtotal: svc.price,
        serviceId: svc.id,
      };
      setItems((prev) => [...prev, newItem]);
    }
  }, []);

  const updateQty = (id: string, qty: number) => {
    if (qty < 1) return;
    setItems((prev) =>
      prev.map((i) =>
        i.id === id ? { ...i, qty, subtotal: i.unitPrice * qty } : i,
      ),
    );
  };

  const removeItem = (id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0) {
      toast("Minimal satu item transaksi", "error");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/sales", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerId: selectedCustomer?.id || null,
          serviceOrderId,
          items: items.map((i) => ({
            type: i.type,
            description: i.description,
            qty: i.qty,
            unitPrice: i.unitPrice,
            inventoryId: i.inventoryId || null,
            serviceId: i.serviceId || null,
          })),
          discount,
          notes: "Transaksi POS",
          paymentMethod,
          dpAmount,
        }),
      });
      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.error || "Gagal menyimpan transaksi");
      }
      const json = await res.json();
      toast("Transaksi berhasil disimpan.");
      router.push(`/admin/pos/success?sale=${json.data?.saleNumber ?? ""}`);
    } catch (err) {
      toast(err instanceof Error ? err.message : "Gagal menyimpan transaksi", "error");
    } finally {
      setSaving(false);
    }
  };

  const resetTransaction = () => {
    setSelectedCustomer(null);
    setItems([]);
    setDiscount(0);
    setDpAmount(0);
    setPaymentMethod("CASH");
    setServiceOrderId(null);
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
        eyebrow="Operasional"
        title="POS / Kasir"
        description="Transaksi jasa servis dan penjualan spare part."
        actions={
          <button
            onClick={resetTransaction}
            className="inline-flex items-center gap-2 rounded-lg border border-white/10 px-3 py-2 text-xs text-slate-300 hover:bg-white/5"
          >
            <Icon name="refresh" className="h-4 w-4" />
            Reset
          </button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-12">
        {/* Left: Transaction Form */}
        <div className="lg:col-span-6 rounded-2xl border border-white/10 bg-white/[0.02] p-4 sm:p-6">
          <div className="mb-5">
            <h2 className="font-display text-lg font-bold text-white">
              Transaksi Baru
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Pilih pelanggan, tambahkan item, dan catat pembayaran.
            </p>
          </div>

          <div className="space-y-3">
            <div>
              <label className="text-[0.65rem] font-semibold uppercase tracking-wider text-slate-400 mb-1 block">
                Pelanggan
              </label>
              <select
                value={selectedCustomer?.id ?? ""}
                onChange={(e) => {
                  const id = e.target.value;
                  const c = customers.find((x) => x.id === id);
                  setSelectedCustomer(c ?? null);
                }}
                className="w-full text-sm text-slate-200 bg-white/[0.03] border border-white/10 rounded-lg px-3 py-2 focus:border-brass-500 focus:outline-none"
              >
                <option value="">Pilih pelanggan...</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.code})
                  </option>
                ))}
              </select>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="text-[0.65rem] font-semibold uppercase tracking-wider text-slate-400 mb-1 block">
                  Diskon (Rp)
                </label>
                <input
                  value={discount}
                  onChange={(e) => setDiscount(Math.max(0, Number(e.target.value) || 0))}
                  type="number"
                  className="w-full text-sm text-slate-200 bg-white/[0.03] border border-white/10 rounded-lg px-3 py-2 focus:border-brass-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="text-[0.65rem] font-semibold uppercase tracking-wider text-slate-400 mb-1 block">
                  DP (Rp)
                </label>
                <input
                  value={dpAmount}
                  onChange={(e) => setDpAmount(Math.max(0, Number(e.target.value) || 0))}
                  type="number"
                  className="w-full text-sm text-slate-200 bg-white/[0.03] border border-white/10 rounded-lg px-3 py-2 focus:border-brass-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="text-[0.65rem] font-semibold uppercase tracking-wider text-slate-400 mb-1 block">
                  Metode Pembayaran
                </label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value as any)}
                  className="w-full text-sm text-slate-200 bg-white/[0.03] border border-white/10 rounded-lg px-3 py-2 focus:border-brass-500 focus:outline-none"
                >
                  {PAYMENT_METHODS.map((m) => (
                    <option key={m.value} value={m.value}>
                      {m.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="mt-4 rounded-xl border border-white/10 bg-white/[0.02] p-4">
            <h3 className="text-[0.65rem] font-semibold uppercase tracking-wider text-slate-400 mb-3">
              Item Transaksi
            </h3>
            <div className="space-y-2">
              {items.length > 0 ? (
                items.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between gap-2 rounded-lg border border-white/10 p-2"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-200 truncate">
                        {item.description}
                      </p>
                      <p className="text-[0.65rem] text-slate-500 truncate">
                        {item.type === "PART" ? "Part" : item.type === "JASA" ? "Jasa" : "Lainnya"}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        value={item.qty}
                        onChange={(e) => updateQty(item.id, Math.max(1, Number(e.target.value) || 1))}
                        type="number"
                        className="w-12 text-sm text-slate-200 bg-white/[0.03] border border-white/10 rounded px-2 py-1 focus:border-brass-500 focus:outline-none"
                      />
                      <span className="text-sm font-mono text-slate-300">
                        {formatIDR(item.subtotal)}
                      </span>
                      <button
                        onClick={() => removeItem(item.id)}
                        className="rounded bg-rose-500/10 px-2 py-1 text-rose-400 hover:bg-rose-500/20"
                        title="Hapus"
                      >
                        <Icon name="trash" className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-xs text-slate-500 text-center py-4">
                  Belum ada item. Tambah jasa atau spare part di bawah.
                </p>
              )}
            </div>
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div>
              <label className="text-[0.65rem] font-semibold uppercase tracking-wider text-slate-400 mb-1 block">
                Tambah Jasa Servis
              </label>
              <select
                className="w-full text-sm text-slate-200 bg-white/[0.03] border border-white/10 rounded-lg px-3 py-2 focus:border-brass-500 focus:outline-none"
                onChange={(e) => {
                  const id = e.target.value;
                  if (!id) return;
                  const svc = services.find((x) => x.id === id);
                  addItem("JASA", svc ?? null);
                  e.target.value = "";
                }}
              >
                <option value="">Pilih jasa...</option>
                {services.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} - {formatIDR(s.price)}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-[0.65rem] font-semibold uppercase tracking-wider text-slate-400 mb-1 block">
                Tambah Spare Part
              </label>
              <select
                className="w-full text-sm text-slate-200 bg-white/[0.03] border border-white/10 rounded-lg px-3 py-2 focus:border-brass-500 focus:outline-none"
                onChange={(e) => {
                  const id = e.target.value;
                  if (!id) return;
                  const inv = inventory.find((x) => x.id === id);
                  addItem("PART", inv ?? null);
                  e.target.value = "";
                }}
              >
                <option value="">Pilih part...</option>
                {inventory.map((i) => (
                  <option key={i.id} value={i.id} disabled={i.stock <= 0}>
                    {i.name} ({i.sku}) - {formatIDR(i.sellPrice)}
                    {i.stock <= 0 ? " (stok habis)" : ""}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="mt-4 rounded-lg border border-brass-500/30 bg-brass-500/10 p-4">
            <div className="flex justify-between text-sm mb-1">
              <span className="text-slate-400">Subtotal</span>
              <span className="font-mono text-slate-300">{formatIDR(subtotal)}</span>
            </div>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-slate-400">Diskon</span>
              <span className="font-mono text-rose-400">-{formatIDR(discount)}</span>
            </div>
            <div className="flex justify-between text-sm font-bold text-white mb-1">
              <span>Total</span>
              <span className="font-mono">{formatIDR(total)}</span>
            </div>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-slate-400">DP</span>
              <span className="font-mono text-emerald-400">{formatIDR(paid)}</span>
            </div>
            <div className="flex justify-between text-sm font-bold text-amber-400">
              <span>Sisa</span>
              <span className="font-mono">{formatIDR(remaining)}</span>
            </div>
          </div>

          <button
            onClick={handleSave}
            disabled={saving || items.length === 0 || remaining > 0 && paymentMethod !== "CASH"}
            className={cn(
              "w-full mt-5 rounded-xl px-5 py-3 text-sm font-bold transition-colors",
              items.length === 0
                ? "bg-white/[0.05] text-slate-500 border border-white/10 cursor-not-allowed"
                : remaining > 0
                  ? "bg-amber-500 text-ink-950 hover:bg-amber-400"
                  : "bg-emerald-500 text-ink-950 hover:bg-emerald-400",
            )}
          >
            {saving ? "Memproses..." : remaining > 0 ? "Simpan & Tandai Partial" : "Simpan & Lunas"}
          </button>
        </div>

        {/* Right: Summary */}
        <div className="lg:col-span-3 rounded-2xl border border-white/10 bg-white/[0.02] p-4 sm:p-6 sticky top-6">
          <h3 className="text-[0.65rem] font-semibold uppercase tracking-wider text-slate-400 mb-4">
            Ringkasan
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-slate-400">Subtotal</span>
              <span className="font-mono text-slate-300">{formatIDR(subtotal)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-400">Diskon</span>
              <span className="font-mono text-rose-400">-{formatIDR(discount)}</span>
            </div>
            <div className="flex justify-between text-sm font-bold text-white">
              <span>Total</span>
              <span className="font-mono">{formatIDR(total)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-400">DP</span>
              <span className="font-mono text-emerald-400">{formatIDR(paid)}</span>
            </div>
            <div className="flex justify-between text-sm font-bold text-amber-400 pt-1 border-t border-white/10">
              <span>Sisa</span>
              <span className="font-mono">{formatIDR(remaining)}</span>
            </div>
          </div>
          <p className={cn("mt-4 text-xs text-center", remaining > 0 ? "text-rose-400" : "text-emerald-400")}>
            {remaining > 0 ? "Transaksi belum lunas" : "Transaksi lunas"}
          </p>
          <p className="text-[0.6rem] text-slate-500 text-center mt-1">
            {selectedCustomer ? selectedCustomer.name : "Belum pilih pelanggan"}
          </p>
        </div>
      </div>
    </div>
  );
}
