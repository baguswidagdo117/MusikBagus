"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PAYMENT_METHODS } from "@/lib/status";
import { formatIDR } from "@/lib/utils";
import { toast } from "../toast";
import { Icon } from "../icons";

export function PaymentForm({
  orderId,
  customerId,
  remaining,
}: {
  orderId: string;
  customerId: string;
  remaining: number;
}) {
  const router = useRouter();
  const [amount, setAmount] = useState(String(remaining > 0 ? remaining : ""));
  const [method, setMethod] = useState("CASH");
  const [type, setType] = useState<"DP" | "PELUNASAN" | "REFUND">(
    remaining > 0 ? "PELUNASAN" : "REFUND",
  );
  const [loading, setLoading] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    const value = Number(amount);
    if (!value || value <= 0) {
      toast("Nominal harus lebih dari 0.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          serviceOrderId: orderId,
          customerId,
          amount: value,
          method,
          type,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Gagal mencatat pembayaran.");
      toast(`Pembayaran ${formatIDR(value)} dicatat.`);
      setAmount("");
      router.refresh();
    } catch (err) {
      toast(err instanceof Error ? err.message : "Gagal mencatat pembayaran.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={submit} className="mt-3 space-y-2.5">
      <div>
        <label htmlFor="pay-amount" className="label-dark">
          Nominal (Rp)
        </label>
        <input
          id="pay-amount"
          type="number"
          min={1}
          step={1000}
          className="input-dark"
          value={amount}
          onChange={(event) => setAmount(event.target.value)}
          placeholder={remaining > 0 ? String(remaining) : "0"}
          required
        />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label htmlFor="pay-method" className="label-dark">
            Metode
          </label>
          <select
            id="pay-method"
            className="select-dark"
            value={method}
            onChange={(event) => setMethod(event.target.value)}
          >
            {PAYMENT_METHODS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="pay-type" className="label-dark">
            Jenis
          </label>
          <select
            id="pay-type"
            className="select-dark"
            value={type}
            onChange={(event) =>
              setType(event.target.value as "DP" | "PELUNASAN" | "REFUND")
            }
          >
            <option value="DP">DP</option>
            <option value="PELUNASAN">Pelunasan</option>
            <option value="REFUND">Refund</option>
          </select>
        </div>
      </div>
      <button type="submit" disabled={loading} className="btn-primary w-full">
        {loading ? (
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-ink-950/30 border-t-ink-950" />
        ) : (
          <Icon name="wallet" className="h-4 w-4" />
        )}
        Catat Pembayaran
      </button>
    </form>
  );
}
