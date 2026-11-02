"use client";

import { useEffect, useState } from "react";
import { Icon } from "./icons";
import { cn } from "@/lib/utils";

type ToastType = "success" | "error" | "info";
type ToastItem = { id: number; message: string; type: ToastType };

export function toast(message: string, type: ToastType = "success") {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent("bagusmusik:toast", { detail: { message, type } }),
  );
}

export function Toaster() {
  const [items, setItems] = useState<ToastItem[]>([]);

  useEffect(() => {
    function handler(event: Event) {
      const detail = (event as CustomEvent<{ message: string; type: ToastType }>)
        .detail;
      const id = Date.now() + Math.random();
      setItems((prev) => [...prev, { id, ...detail }]);
      window.setTimeout(() => {
        setItems((prev) => prev.filter((item) => item.id !== id));
      }, 4200);
    }
    window.addEventListener("bagusmusik:toast", handler);
    return () => window.removeEventListener("bagusmusik:toast", handler);
  }, []);

  return (
    <div className="pointer-events-none fixed inset-x-0 top-3 z-[100] flex flex-col items-center gap-2 px-4 sm:top-5">
      {items.map((item) => (
        <div
          key={item.id}
          className={cn(
            "pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-xl border px-4 py-3 text-sm shadow-soft animate-fade-up",
            item.type === "success" &&
              "border-emerald-500/30 bg-emerald-950/95 text-emerald-100",
            item.type === "error" &&
              "border-rose-500/30 bg-rose-950/95 text-rose-100",
            item.type === "info" &&
              "border-sky-500/30 bg-sky-950/95 text-sky-100",
          )}
          role="status"
        >
          <Icon
            name={
              item.type === "success"
                ? "check"
                : item.type === "error"
                  ? "alert"
                  : "bell"
            }
            className="mt-0.5 h-4 w-4"
          />
          <span className="leading-snug">{item.message}</span>
        </div>
      ))}
    </div>
  );
}
