"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { AdminPageHeader } from "@/components/admin/page-header";
import { Icon } from "@/components/icons";
import { cn } from "@/lib/utils";

type QrPreset = {
  label: string;
  path: string;
  src: string;
};

const PRESETS: QrPreset[] = [
  { label: "Booking Servis", path: "/booking", src: "qr-web" },
  { label: "Cek Status Servis", path: "/cek-status", src: "qr-status" },
  { label: "Website Utama", path: "/", src: "qr-home" },
];

export default function QrPage() {
  const [appUrl, setAppUrl] = useState("");
  const [qrs, setQrs] = useState<Map<string, string>>(new Map());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setAppUrl(
      typeof window !== "undefined" && window.location.origin
        ? window.location.origin
        : "",
    );
    generate();
  }, []);

  async function generate() {
    if (!appUrl) return;
    setLoading(true);
    try {
      const map = new Map<string, string>();
      await Promise.all(
        PRESETS.map(async (p) => {
          const url = `${appUrl}${p.path}?src=${p.src}`;
          const svg = await QRCode.toString(url, {
            type: "svg",
            margin: 1,
            width: 260,
            color: { dark: "#111418", light: "#ffffff" },
          });
          map.set(p.label, svg);
        }),
      );
      setQrs(map);
    } finally {
      setLoading(false);
    }
  }

  function downloadSvg(svg: string, filename: string) {
    const blob = new Blob([svg], { type: "image/svg+xml" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

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
        title="QR Code Akses Cepat"
        description="Cetak QR untuk ditempel di toko, meja penerimaan alat, atau nota pelanggan."
      />

      <div className="panel overflow-hidden p-4 sm:p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-display text-lg font-bold text-white">
              URL Dasar
            </h2>
            <p className="text-sm text-slate-400 mt-1">
              Semua QR di bawah ini mengarah ke alamat website Anda.
            </p>
          </div>
          <button
            onClick={generate}
            className="inline-flex items-center gap-2 rounded-lg bg-white/5 px-3 py-2 text-xs text-slate-300 hover:bg-white/10"
          >
            <Icon name="refresh" className="h-4 w-4" />
            Regenerasi
          </button>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {Array.from(qrs.entries()).map(([label, svg]) => (
            <div
              key={label}
              className="rounded-2xl border border-white/10 bg-white/[0.02] p-5"
            >
              <div className="mb-3">
                <p className="text-[0.65rem] font-semibold uppercase tracking-wider text-slate-400">
                  {label}
                </p>
              </div>
              <div className="flex flex-col items-center gap-3">
                <div
                  className="rounded-xl border border-white/10 p-1 bg-white/[0.03]"
                  dangerouslySetInnerHTML={{ __html: svg }}
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => downloadSvg(svg, `qr-${label.toLowerCase().replace(" ", "-")}.svg`)}
                    className="flex-1 inline-flex items-center gap-2 rounded-lg bg-brass-500 px-3 py-2 text-xs font-bold text-ink-950 hover:bg-brass-400 transition-colors"
                  >
                    <Icon name="download" className="h-3.5 w-3.5" />
                    Unduh SVG
                  </button>
                </div>
                <p className="text-[0.6rem] text-slate-500 text-center">
                  Cetak minimal 3×3 cm
                </p>
              </div>
            </div>
          ))}
        </div>

        <div className="rounded-xl border border-white/10 bg-white/[0.02] p-5">
          <p className="text-[0.65rem] font-semibold uppercase tracking-wider text-slate-400 mb-2">
            Panduan Pencetakan
          </p>
          <ul className="space-y-2 text-sm text-slate-400">
            <li className="flex items-start gap-2">
              <Icon name="check" className="mt-0.5 h-4 w-4 text-brass-500" />
              Tempel QR di meja penerimaan alat dan dapur dapur.
            </li>
            <li className="flex items-start gap-2">
              <Icon name="check" className="mt-0.5 h-4 w-4 text-brass-500" />
              Tempel pada nota servis untuk pelanggan cek status.
            </li>
            <li className="flex items-start gap-2">
              <Icon name="check" className="mt-0.5 h-4 w-4 text-brass-500" />
              Gunakan QR media promosi untuk booking online.
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
