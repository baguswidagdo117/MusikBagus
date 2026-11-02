"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "../toast";
import { Icon } from "../icons";

export function CreateInvoiceButton({ orderId }: { orderId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function create() {
    setLoading(true);
    try {
      const res = await fetch(`/api/service-orders/${orderId}/invoice`, {
        method: "POST",
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Gagal membuat invoice.");
      toast(`Invoice ${json.data.invoiceNumber} diterbitkan.`);
      router.refresh();
    } catch (err) {
      toast(err instanceof Error ? err.message : "Gagal membuat invoice.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      type="button"
      onClick={create}
      disabled={loading}
      className="btn-white"
    >
      {loading ? (
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
      ) : (
        <Icon name="file" className="h-4 w-4" />
      )}
      Terbitkan Invoice
    </button>
  );
}
