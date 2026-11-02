"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { Icon } from "./icons";
import { toast } from "./toast";
import { cn, formatIDR } from "@/lib/utils";
import { INSTRUMENTS } from "@/lib/status";
import { InstrumentArt } from "./instrument-art";

type ServiceOption = {
  id: string;
  name: string;
  category: string;
  price: number;
  durationMin: number;
};

type Settings = {
  whatsapp: string;
  phone: string;
  openingHours: string;
  bookingMode: "GRATIS" | "DP_NOMINAL" | "DP_PERSEN";
  dpNominal: number;
  dpPercent: number;
  paymentDeadlineHours: number;
  cancellationPolicy: string;
};

type FormState = {
  name: string;
  whatsapp: string;
  email: string;
  instrumentType: string;
  brand: string;
  model: string;
  serialNumber: string;
  complaint: string;
  serviceId: string;
  date: string;
  time: string;
  notes: string;
  photoUrl: string;
  source: string;
};

type BookingResult = {
  bookingNumber: string;
  id: string;
  status: string;
  date: string;
  time: string;
};

const DRAFT_KEY = "bm-booking-draft-v1";

function localDateString(date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

const TIME_SLOTS = Array.from({ length: 21 }, (_, i) => {
  const total = 9 * 60 + i * 30;
  const h = String(Math.floor(total / 60)).padStart(2, "0");
  const m = String(total % 60).padStart(2, "0");
  return `${h}:${m}`;
});

async function compressImage(file: File): Promise<Blob> {
  const objectUrl = URL.createObjectURL(file);
  try {
    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error("Gagal membaca gambar"));
      img.src = objectUrl;
    });
    const maxSide = 1600;
    const scale = Math.min(1, maxSide / Math.max(image.width, image.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(image.width * scale);
    canvas.height = Math.round(image.height * scale);
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas tidak tersedia");
    ctx.drawImage(image, 0, 0, canvas.width, canvas.height);

    let quality = 0.82;
    let blob: Blob | null = null;
    for (let attempt = 0; attempt < 4; attempt++) {
      blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob(resolve, "image/jpeg", quality),
      );
      if (!blob) break;
      if (blob.size <= 1.5 * 1024 * 1024) break;
      quality -= 0.15;
    }
    if (!blob) throw new Error("Gagal mengompres gambar");
    return blob;
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

export function BookingWizard({
  services,
  initialServiceId,
  source,
  settings,
}: {
  services: ServiceOption[];
  initialServiceId: string;
  source: string;
  settings: Settings;
}) {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<FormState>({
    name: "",
    whatsapp: "",
    email: "",
    instrumentType: "Gitar",
    brand: "",
    model: "",
    serialNumber: "",
    complaint: "",
    serviceId: initialServiceId || services[0]?.id || "",
    date: localDateString(),
    time: "10:00",
    notes: "",
    photoUrl: "",
    source,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [result, setResult] = useState<BookingResult | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const cameraRef = useRef<HTMLInputElement>(null);
  const galleryRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(DRAFT_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === "object") {
          setForm((prev) => ({
            ...prev,
            ...parsed,
            photoUrl: parsed.photoUrl || "",
            serviceId: initialServiceId || parsed.serviceId || prev.serviceId,
            source,
          }));
        }
      }
    } catch {
      // draft rusak diabaikan
    }
    setHydrated(true);
  }, [initialServiceId, source]);

  useEffect(() => {
    if (!hydrated || result) return;
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify(form));
    } catch {
      // storage penuh diabaikan
    }
  }, [form, hydrated, result]);

  const selectedService = services.find((s) => s.id === form.serviceId);
  const waNumber = settings.whatsapp.replace(/^0/, "62").replace(/\D/g, "");

  const dpInfo = useMemo(() => {
    if (!selectedService || settings.bookingMode === "GRATIS") return null;
    const amount =
      settings.bookingMode === "DP_NOMINAL"
        ? settings.dpNominal
        : Math.round((selectedService.price * settings.dpPercent) / 100);
    return {
      amount,
      label:
        settings.bookingMode === "DP_NOMINAL"
          ? "DP tetap"
          : `DP ${settings.dpPercent}%`,
    };
  }, [selectedService, settings]);

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => {
      if (!prev[key as string]) return prev;
      const next = { ...prev };
      delete next[key as string];
      return next;
    });
  }

  function validateStep(current: number) {
    const next: Record<string, string> = {};
    if (current === 0) {
      if (form.name.trim().length < 2) next.name = "Nama minimal 2 karakter.";
      if (!/^[0-9+\-\s()]{8,20}$/.test(form.whatsapp.trim()))
        next.whatsapp = "Nomor WhatsApp tidak valid.";
      if (
        form.email.trim() &&
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())
      )
        next.email = "Format email tidak valid.";
    }
    if (current === 1) {
      if (!form.instrumentType) next.instrumentType = "Pilih jenis alat musik.";
      if (!form.serviceId) next.serviceId = "Pilih jenis layanan.";
      if (form.complaint.trim().length < 10)
        next.complaint = "Ceritakan keluhan minimal 10 karakter.";
    }
    if (current === 2) {
      if (!form.date) next.date = "Tanggal wajib diisi.";
      else if (form.date < localDateString())
        next.date = "Tanggal tidak boleh di masa lalu.";
      if (!form.time) next.time = "Jam wajib diisi.";
      if (!agreed) next.agreed = "Setujui kebijakan pembatalan untuk melanjutkan.";
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  function nextStep() {
    if (!validateStep(step)) return;
    setStep((s) => Math.min(2, s + 1));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function prevStep() {
    setStep((s) => Math.max(0, s - 1));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function handleFile(file: File | undefined) {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast("File harus berupa gambar.", "error");
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      toast("Ukuran foto maksimal 8MB sebelum dikompres.", "error");
      return;
    }
    setUploading(true);
    try {
      const compressed = await compressImage(file);
      const body = new FormData();
      body.append("file", compressed, "foto-booking.jpg");
      const res = await fetch("/api/upload", { method: "POST", body });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Upload gagal");
      update("photoUrl", json.data.url);
      toast("Foto berhasil diunggah.");
    } catch (err) {
      toast(err instanceof Error ? err.message : "Upload gagal.", "error");
    } finally {
      setUploading(false);
      if (cameraRef.current) cameraRef.current.value = "";
      if (galleryRef.current) galleryRef.current.value = "";
    }
  }

  async function submit() {
    if (!validateStep(2)) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          email: form.email || undefined,
          brand: form.brand || undefined,
          model: form.model || undefined,
          serialNumber: form.serialNumber || undefined,
          notes: form.notes || undefined,
          photoUrl: form.photoUrl || undefined,
          source: form.source || "web",
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        if (json.details?.fieldErrors) {
          const fieldErrors: Record<string, string> = {};
          for (const [key, value] of Object.entries(
            json.details.fieldErrors as Record<string, string[]>,
          )) {
            if (value?.[0]) fieldErrors[key] = value[0];
          }
          setErrors(fieldErrors);
        }
        throw new Error(json.error || "Booking gagal dikirim.");
      }
      setResult(json.data);
      localStorage.removeItem(DRAFT_KEY);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      toast(err instanceof Error ? err.message : "Booking gagal.", "error");
    } finally {
      setSubmitting(false);
    }
  }

  function resetWizard() {
    setResult(null);
    setStep(0);
    setForm({
      name: "",
      whatsapp: "",
      email: "",
      instrumentType: "Gitar",
      brand: "",
      model: "",
      serialNumber: "",
      complaint: "",
      serviceId: services[0]?.id || "",
      date: localDateString(),
      time: "10:00",
      notes: "",
      photoUrl: "",
      source: "web",
    });
    setErrors({});
    setAgreed(false);
  }

  if (result) {
    const message = encodeURIComponent(
      `Halo BagusMusik, saya ingin menanyakan booking ${result.bookingNumber} (${form.instrumentType} ${form.brand} ${form.model}). Terima kasih.`,
    );
    return (
      <div className="mx-auto max-w-2xl animate-fade-up">
        <div className="overflow-hidden rounded-3xl border border-emerald-600/20 bg-white shadow-soft">
          <div className="bg-gradient-to-br from-emerald-600 to-emerald-800 px-6 py-8 text-white">
            <span className="grid h-12 w-12 place-items-center rounded-full bg-white/15">
              <Icon name="check" className="h-6 w-6" />
            </span>
            <h2 className="mt-4 font-display text-3xl font-bold">
              Booking berhasil dikirim
            </h2>
            <p className="mt-1 text-sm text-emerald-100">
              Simpan nomor booking ini untuk memantau status servis.
            </p>
          </div>
          <div className="p-6">
            <div className="rounded-2xl border border-dashed border-ink-900/20 bg-[#f8f4ec] p-4 text-center">
              <p className="text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-ink-500">
                Nomor Booking
              </p>
              <p className="mt-1 font-mono text-2xl font-bold tracking-wide text-ink-950">
                {result.bookingNumber}
              </p>
            </div>
            <dl className="mt-5 grid gap-3 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-xs uppercase tracking-wider text-ink-500">
                  Nama
                </dt>
                <dd className="mt-0.5 font-medium text-ink-900">{form.name}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wider text-ink-500">
                  Alat
                </dt>
                <dd className="mt-0.5 font-medium text-ink-900">
                  {form.instrumentType} {form.brand} {form.model}
                </dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wider text-ink-500">
                  Layanan
                </dt>
                <dd className="mt-0.5 font-medium text-ink-900">
                  {selectedService?.name ?? "-"}
                </dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wider text-ink-500">
                  Jadwal
                </dt>
                <dd className="mt-0.5 font-medium text-ink-900">
                  {new Date(`${result.date}`).toLocaleDateString("id-ID", {
                    day: "2-digit",
                    month: "long",
                    year: "numeric",
                  })}{" "}
                  • {result.time} WIB
                </dd>
              </div>
            </dl>
            <div className="mt-5 rounded-xl bg-brass-500/10 p-3 text-xs leading-relaxed text-ink-700">
              Admin akan mengonfirmasi booking melalui WhatsApp. Anda juga dapat
              datang langsung sesuai jadwal yang dipilih.
              {dpInfo
                ? ` Pembayaran ${dpInfo.label} sebesar ${formatIDR(dpInfo.amount)} dapat dilakukan saat konfirmasi.`
                : " Booking gratis, tanpa biaya di muka."}
            </div>
            <div className="mt-6 flex flex-col gap-2 sm:flex-row">
              <Link
                href={`/cek-status?no=${encodeURIComponent(result.bookingNumber)}`}
                className="btn-primary flex-1"
              >
                <Icon name="search" className="h-4 w-4" />
                Cek Status
              </Link>
              <a
                href={`https://wa.me/${waNumber}?text=${message}`}
                target="_blank"
                rel="noreferrer"
                className="btn-outline flex-1"
              >
                <Icon name="whatsapp" className="h-4 w-4" />
                Hubungi WhatsApp
              </a>
            </div>
            <button
              type="button"
              onClick={resetWizard}
              className="btn-ghost mt-2 w-full text-ink-600"
            >
              Buat booking lain
            </button>
          </div>
        </div>
      </div>
    );
  }

  const steps = ["Data Anda", "Data Alat", "Jadwal & Kirim"];

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_340px]">
      <div className="rounded-3xl border border-ink-900/10 bg-white p-4 shadow-sm sm:p-7">
        <div className="mb-6">
          <div className="flex items-center justify-between text-xs font-semibold text-ink-500">
            <span>
              Langkah {step + 1} dari 3 &middot; {steps[step]}
            </span>
            <span>{Math.round(((step + 1) / 3) * 100)}%</span>
          </div>
          <div className="mt-2 flex gap-1.5">
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                className={cn(
                  "h-1.5 flex-1 rounded-full transition-colors",
                  i <= step ? "bg-brass-500" : "bg-ink-900/10",
                )}
              />
            ))}
          </div>
        </div>

        {step === 0 ? (
          <div className="space-y-5 animate-fade-up">
            <div>
              <p className="font-display text-2xl font-bold text-ink-950">
                Kenalan dulu, yuk
              </p>
              <p className="mt-1 text-sm text-ink-600">
                Data ini dipakai untuk konfirmasi jadwal dan update servis.
              </p>
            </div>
            <div>
              <label htmlFor="name" className="label">
                Nama lengkap
              </label>
              <input
                id="name"
                className="input"
                type="text"
                autoComplete="name"
                placeholder="Contoh: Sutesno Wijaya"
                value={form.name}
                onChange={(e) => update("name", e.target.value)}
              />
              {errors.name ? (
                <p className="field-error">{errors.name}</p>
              ) : null}
            </div>
            <div>
              <label htmlFor="whatsapp" className="label">
                Nomor WhatsApp
              </label>
              <input
                id="whatsapp"
                className="input"
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                placeholder="08xx xxxx xxxx"
                value={form.whatsapp}
                onChange={(e) => update("whatsapp", e.target.value)}
              />
              {errors.whatsapp ? (
                <p className="field-error">{errors.whatsapp}</p>
              ) : (
                <p className="field-hint">
                  Nomor ini akan dihubungi admin untuk konfirmasi.
                </p>
              )}
            </div>
            <div>
              <label htmlFor="email" className="label">
                Email <span className="font-normal normal-case">(opsional)</span>
              </label>
              <input
                id="email"
                className="input"
                type="email"
                inputMode="email"
                autoComplete="email"
                placeholder="nama@email.com"
                value={form.email}
                onChange={(e) => update("email", e.target.value)}
              />
              {errors.email ? (
                <p className="field-error">{errors.email}</p>
              ) : null}
            </div>
          </div>
        ) : null}

        {step === 1 ? (
          <div className="space-y-5 animate-fade-up">
            <div>
              <p className="font-display text-2xl font-bold text-ink-950">
                Alat musik & keluhan
              </p>
              <p className="mt-1 text-sm text-ink-600">
                Semakin detail keluhan, semakin cepat diagnosis teknisi.
              </p>
            </div>

            <div>
              <span className="label">Jenis alat musik</span>
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
                {INSTRUMENTS.map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => update("instrumentType", item)}
                    className={cn(
                      "flex min-h-[72px] flex-col items-center justify-center gap-1.5 rounded-xl border px-1 py-2 text-[0.7rem] font-semibold transition-colors",
                      form.instrumentType === item
                        ? "border-ink-900 bg-ink-900 text-white"
                        : "border-ink-900/10 bg-white text-ink-700 hover:border-brass-400",
                    )}
                  >
                    <InstrumentArt
                      name={item}
                      className={cn(
                        "h-8 w-8 rounded-lg",
                        form.instrumentType === item &&
                          "bg-brass-500/20 text-brass-300",
                      )}
                    />
                    {item}
                  </button>
                ))}
              </div>
              {errors.instrumentType ? (
                <p className="field-error">{errors.instrumentType}</p>
              ) : null}
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="brand" className="label">
                  Merek
                </label>
                <input
                  id="brand"
                  className="input"
                  type="text"
                  placeholder="Yamaha, Roland, Pearl..."
                  value={form.brand}
                  onChange={(e) => update("brand", e.target.value)}
                />
              </div>
              <div>
                <label htmlFor="model" className="label">
                  Model
                </label>
                <input
                  id="model"
                  className="input"
                  type="text"
                  placeholder="F310, E-X20..."
                  value={form.model}
                  onChange={(e) => update("model", e.target.value)}
                />
              </div>
            </div>

            <div>
              <label htmlFor="serial" className="label">
                Nomor seri{" "}
                <span className="font-normal normal-case">(opsional)</span>
              </label>
              <input
                id="serial"
                className="input font-mono"
                type="text"
                placeholder="Tertera pada body / label alat"
                value={form.serialNumber}
                onChange={(e) => update("serialNumber", e.target.value)}
              />
            </div>

            <div>
              <label htmlFor="service" className="label">
                Jenis layanan
              </label>
              <select
                id="service"
                className="select"
                value={form.serviceId}
                onChange={(e) => update("serviceId", e.target.value)}
              >
                <option value="">Pilih layanan</option>
                {services.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} - {formatIDR(s.price)}
                  </option>
                ))}
              </select>
              {errors.serviceId ? (
                <p className="field-error">{errors.serviceId}</p>
              ) : null}
            </div>

            <div>
              <label htmlFor="complaint" className="label">
                Keluhan / kerusakan
              </label>
              <textarea
                id="complaint"
                className="textarea"
                rows={4}
                placeholder="Contoh: bunyi dengung di fret 3, aksi senar terlalu tinggi, dan potensio volume kresek-kresek."
                value={form.complaint}
                onChange={(e) => update("complaint", e.target.value)}
              />
              <div className="flex justify-between">
                {errors.complaint ? (
                  <p className="field-error">{errors.complaint}</p>
                ) : (
                  <p className="field-hint">
                    Ceritakan kondisi terakhir sebelum masalah muncul.
                  </p>
                )}
                <span className="mt-1 text-xs text-ink-400">
                  {form.complaint.length}/2000
                </span>
              </div>
            </div>

            <div>
              <span className="label">
                Foto alat / kerusakan{" "}
                <span className="font-normal normal-case">(opsional)</span>
              </span>
              <input
                ref={cameraRef}
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={(e) => handleFile(e.target.files?.[0])}
              />
              <input
                ref={galleryRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => handleFile(e.target.files?.[0])}
              />
              {form.photoUrl ? (
                <div className="relative overflow-hidden rounded-xl border border-ink-900/10">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={form.photoUrl}
                    alt="Foto alat"
                    className="h-44 w-full object-cover"
                  />
                  <div className="flex items-center justify-between gap-2 bg-white p-2">
                    <span className="text-xs text-emerald-700">
                      Foto terunggah
                    </span>
                    <button
                      type="button"
                      className="btn-ghost btn-sm text-rose-600"
                      onClick={() => update("photoUrl", "")}
                    >
                      <Icon name="trash" className="h-3.5 w-3.5" />
                      Hapus
                    </button>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => cameraRef.current?.click()}
                    disabled={uploading}
                    className="flex min-h-24 flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-ink-900/20 bg-[#faf7f1] px-3 py-4 text-xs font-semibold text-ink-700 hover:border-brass-400 disabled:opacity-50"
                  >
                    <Icon name="camera" className="h-5 w-5 text-brass-700" />
                    Ambil Foto
                  </button>
                  <button
                    type="button"
                    onClick={() => galleryRef.current?.click()}
                    disabled={uploading}
                    className="flex min-h-24 flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-ink-900/20 bg-[#faf7f1] px-3 py-4 text-xs font-semibold text-ink-700 hover:border-brass-400 disabled:opacity-50"
                  >
                    <Icon name="upload" className="h-5 w-5 text-brass-700" />
                    Pilih Galeri
                  </button>
                </div>
              )}
              {uploading ? (
                <p className="mt-2 flex items-center gap-2 text-xs text-brass-700">
                  <span className="h-3 w-3 animate-spin rounded-full border-2 border-brass-500 border-t-transparent" />
                  Mengompres & mengunggah foto...
                </p>
              ) : (
                <p className="field-hint">
                  Foto dikompres otomatis. Format JPG/PNG/WEBP, maksimal 8MB.
                </p>
              )}
            </div>
          </div>
        ) : null}

        {step === 2 ? (
          <div className="space-y-5 animate-fade-up">
            <div>
              <p className="font-display text-2xl font-bold text-ink-950">
                Jadwal kedatangan
              </p>
              <p className="mt-1 text-sm text-ink-600">
                Pilih waktu yang nyaman. Admin akan mengonfirmasi ketersediaan.
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="date" className="label">
                  Tanggal
                </label>
                <input
                  id="date"
                  className="input"
                  type="date"
                  min={localDateString()}
                  value={form.date}
                  onChange={(e) => update("date", e.target.value)}
                />
                {errors.date ? (
                  <p className="field-error">{errors.date}</p>
                ) : null}
              </div>
              <div>
                <label htmlFor="time" className="label">
                  Jam
                </label>
                <select
                  id="time"
                  className="select"
                  value={form.time}
                  onChange={(e) => update("time", e.target.value)}
                >
                  {TIME_SLOTS.map((slot) => (
                    <option key={slot} value={slot}>
                      {slot} WIB
                    </option>
                  ))}
                </select>
                {errors.time ? (
                  <p className="field-error">{errors.time}</p>
                ) : null}
              </div>
            </div>
            <div>
              <label htmlFor="notes" className="label">
                Catatan tambahan{" "}
                <span className="font-normal normal-case">(opsional)</span>
              </label>
              <textarea
                id="notes"
                className="textarea"
                rows={3}
                placeholder="Contoh: tolong hubungi sebelum saya datang, atau alat dititipkan oleh rekan."
                value={form.notes}
                onChange={(e) => update("notes", e.target.value)}
              />
            </div>

            <div className="rounded-2xl border border-ink-900/10 bg-[#faf7f1] p-4">
              <p className="text-[0.65rem] font-bold uppercase tracking-wider text-ink-500">
                Ringkasan booking
              </p>
              <dl className="mt-3 space-y-2 text-sm">
                <div className="flex justify-between gap-4">
                  <dt className="text-ink-500">Nama</dt>
                  <dd className="text-right font-medium text-ink-900">
                    {form.name || "-"}
                  </dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-ink-500">WhatsApp</dt>
                  <dd className="text-right font-medium text-ink-900">
                    {form.whatsapp || "-"}
                  </dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-ink-500">Alat</dt>
                  <dd className="text-right font-medium text-ink-900">
                    {form.instrumentType} {form.brand} {form.model}
                  </dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-ink-500">Layanan</dt>
                  <dd className="text-right font-medium text-ink-900">
                    {selectedService?.name || "-"}
                  </dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-ink-500">Jadwal</dt>
                  <dd className="text-right font-medium text-ink-900">
                    {form.date} • {form.time} WIB
                  </dd>
                </div>
                <div className="flex justify-between gap-4 border-t border-ink-900/10 pt-2">
                  <dt className="text-ink-500">Estimasi biaya</dt>
                  <dd className="text-right font-display text-lg font-bold text-ink-950">
                    {selectedService
                      ? formatIDR(selectedService.price)
                      : "Menunggu diagnosis"}
                  </dd>
                </div>
              </dl>
              {dpInfo ? (
                <p className="mt-3 text-xs leading-relaxed text-ink-600">
                  Kebijakan pembayaran: {dpInfo.label} sebesar{" "}
                  <strong>{formatIDR(dpInfo.amount)}</strong> setelah konfirmasi.
                  Batas pembayaran {settings.paymentDeadlineHours} jam.
                </p>
              ) : (
                <p className="mt-3 text-xs leading-relaxed text-ink-600">
                  Booking ini gratis. Pembayaran dilakukan setelah diagnosis dan
                  persetujuan biaya.
                </p>
              )}
            </div>

            <label className="flex items-start gap-3 text-xs leading-relaxed text-ink-600">
              <input
                type="checkbox"
                className="mt-0.5 h-4 w-4 rounded border-ink-900/30 accent-brass-500"
                checked={agreed}
                onChange={(e) => {
                  setAgreed(e.target.checked);
                  setErrors((prev) => {
                    const next = { ...prev };
                    delete next.agreed;
                    return next;
                  });
                }}
              />
              <span>
                Saya menyetujui kebijakan pembatalan: {settings.cancellationPolicy}
              </span>
            </label>
            {errors.agreed ? (
              <p className="field-error">{errors.agreed}</p>
            ) : null}
          </div>
        ) : null}

        <div className="mt-7 flex flex-col-reverse gap-2 border-t border-ink-900/10 pt-5 sm:flex-row sm:justify-between">
          {step > 0 ? (
            <button type="button" onClick={prevStep} className="btn-outline">
              <Icon name="arrow-left" className="h-4 w-4" />
              Kembali
            </button>
          ) : (
            <span className="hidden sm:block" />
          )}
          {step < 2 ? (
            <button type="button" onClick={nextStep} className="btn-primary">
              Lanjut
              <Icon name="arrow-right" className="h-4 w-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={submit}
              disabled={submitting}
              className="btn-primary"
            >
              {submitting ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-ink-950/30 border-t-ink-950" />
                  Mengirim...
                </>
              ) : (
                <>
                  <Icon name="check" className="h-4 w-4" />
                  Kirim Booking
                </>
              )}
            </button>
          )}
        </div>
      </div>

      <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
        <div className="rounded-2xl border border-ink-900/10 bg-white p-5">
          <p className="font-display text-lg font-bold text-ink-900">
            Butuh bantuan?
          </p>
          <p className="mt-1 text-sm leading-relaxed text-ink-600">
            Tim kami siap membantu memilih layanan atau menjawab pertanyaan
            sebelum Anda booking.
          </p>
          <a
            href={`https://wa.me/${waNumber}?text=${encodeURIComponent("Halo BagusMusik, saya ingin bertanya tentang servis alat musik.")}`}
            target="_blank"
            rel="noreferrer"
            className="btn-dark mt-4 w-full"
          >
            <Icon name="whatsapp" className="h-4 w-4" />
            Chat WhatsApp
          </a>
          <div className="mt-4 space-y-2 border-t border-ink-900/10 pt-4 text-xs text-ink-600">
            <p className="flex items-start gap-2">
              <Icon name="clock" className="h-4 w-4 text-brass-600" />
              {settings.openingHours}
            </p>
            <p className="flex items-start gap-2">
              <Icon name="phone" className="h-4 w-4 text-brass-600" />
              {settings.phone}
            </p>
          </div>
        </div>
        <div className="rounded-2xl bg-ink-950 p-5 text-white">
          <p className="text-[0.65rem] font-bold uppercase tracking-wider text-brass-300">
            Yang perlu dibawa
          </p>
          <ul className="mt-3 space-y-2 text-sm text-slate-300">
            {[
              "Alat musik beserta aksesori (case, adaptor, pedal)",
              "Nomor booking dari halaman ini",
              "Catatan keluhan bila ada",
            ].map((item) => (
              <li key={item} className="flex gap-2">
                <Icon name="check" className="mt-0.5 h-4 w-4 text-brass-400" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-2xl border border-brass-500/30 bg-brass-500/10 p-4 text-xs leading-relaxed text-ink-700">
          <Icon name="shield" className="mb-2 h-4 w-4 text-brass-700" />
          Data Anda hanya digunakan untuk keperluan servis dan tidak dibagikan
          kepada pihak lain.
        </div>
      </aside>
    </div>
  );
}
