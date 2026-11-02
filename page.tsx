import Link from "next/link";
import QRCode from "qrcode";
import { prisma } from "@/lib/db";
import { getSettings } from "@/lib/settings";
import { formatIDR, initials } from "@/lib/utils";
import { PublicHeader } from "@/components/public-header";
import { PublicFooter } from "@/components/public-footer";
import { InstrumentArt, instrumentIcon } from "@/components/instrument-art";
import { Icon } from "@/components/icons";
import { PublicBadge } from "@/components/ui";
import { InstallPrompt } from "@/components/install-prompt";

export const dynamic = "force-dynamic";

const instruments = [
  "Gitar",
  "Bass",
  "Keyboard",
  "Drum",
  "Amplifier",
  "Mikrofon",
];

const steps = [
  {
    title: "Booking online",
    desc: "Pilih layanan, ceritakan keluhan, dan tentukan jadwal kedatangan.",
    icon: "calendar" as const,
  },
  {
    title: "Diagnosis teknisi",
    desc: "Alat diperiksa menyeluruh dan estimasi biaya disetujui bersama.",
    icon: "search" as const,
  },
  {
    title: "Servis dikerjakan",
    desc: "Teknisi mengerjakan perbaikan dan Anda dapat memantau statusnya.",
    icon: "wrench" as const,
  },
  {
    title: "Siap dimainkan",
    desc: "Ambil alat yang sudah diuji, lengkap dengan invoice transparan.",
    icon: "check" as const,
  },
];

const testimonials = [
  {
    name: "Sutesno Wijaya",
    role: "Gitaris akustik",
    quote:
      "Gitar Yamaha saya kembali nyaman dimainkan. Biayanya jelas sejak awal dan progresnya bisa dicek dari HP.",
  },
  {
    name: "Rina Kartika",
    role: "Pengajar keyboard",
    quote:
      "Tuts keyboard yang mati akhirnya normal lagi. Penjelasan teknisi detail dan pengerjaannya cepat.",
  },
  {
    name: "Dimas Prakoso",
    role: "Pemilik studio",
    quote:
      "Amp dan mic studio kami rutin dirawat di sini. Komunikasinya rapi lewat WhatsApp, tidak perlu bolak-balik.",
  },
];

export default async function LandingPage() {
  const [settings, services, orderCount] = await Promise.all([
    getSettings(),
    prisma.service.findMany({
      where: { active: true },
      orderBy: [{ category: "asc" }, { price: "asc" }],
      take: 6,
    }),
    prisma.serviceOrder.count(),
  ]);

  const qrSvg = await QRCode.toString(
    `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/booking?src=qr-web`,
    {
      type: "svg",
      margin: 1,
      width: 220,
      color: { dark: "#111418", light: "#ffffff" },
    },
  );

  return (
    <div className="min-h-dvh">
      <PublicHeader />

      <main>
        <section className="relative overflow-hidden">
          <div className="pointer-events-none absolute inset-0 -z-10">
            <div className="absolute -left-32 top-24 h-72 w-72 rounded-full bg-brass-400/15 blur-3xl" />
            <div className="absolute -right-24 top-10 h-80 w-80 rounded-full bg-ink-900/5 blur-3xl" />
          </div>
          <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 pb-16 pt-12 sm:px-6 sm:pt-16 lg:grid-cols-[1.05fr_0.95fr] lg:gap-10 lg:pb-24 lg:pt-24">
            <div className="animate-fade-up">
              <PublicBadge>
                <span className="h-1.5 w-1.5 rounded-full bg-brass-500" />
                Bengkel musik di Pekalongan
              </PublicBadge>
              <h1 className="mt-5 font-display text-[2.6rem] font-bold leading-[1.05] tracking-tight text-ink-950 text-balance sm:text-6xl">
                Alat musik Anda
                <br />
                layak{" "}
                <span className="relative inline-block text-brass-600">
                  berbunyi
                  <svg
                    className="absolute -bottom-2 left-0 w-full text-brass-400/60"
                    viewBox="0 0 200 12"
                    fill="none"
                    preserveAspectRatio="none"
                    aria-hidden
                  >
                    <path
                      d="M2 9c40-6 96-8 196-3"
                      stroke="currentColor"
                      strokeWidth="4"
                      strokeLinecap="round"
                    />
                  </svg>
                </span>{" "}
                sempurna.
              </h1>
              <p className="mt-6 max-w-xl text-base leading-relaxed text-ink-700 sm:text-lg">
                Servis, reparasi, dan setup alat musik dengan diagnosis
                transparan. Booking dari rumah, pantau progres servis, lalu ambil
                alat yang sudah siap dimainkan.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link href="/booking" className="btn-primary w-full sm:w-auto">
                  <Icon name="calendar" className="h-4 w-4" />
                  Booking Servis
                  <Icon name="arrow-right" className="h-4 w-4" />
                </Link>
                <Link href="/cek-status" className="btn-outline w-full sm:w-auto">
                  <Icon name="search" className="h-4 w-4" />
                  Cek Status Servis
                </Link>
              </div>

              <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3">
                <div className="flex items-center gap-3">
                  <div className="flex -space-x-2">
                    {["SW", "RK", "DP", "AL"].map((x, i) => (
                      <span
                        key={x}
                        className="grid h-9 w-9 place-items-center rounded-full border-2 border-[#f8f4ec] bg-ink-900 text-[0.65rem] font-bold text-brass-300"
                        style={{ zIndex: 4 - i }}
                      >
                        {x}
                      </span>
                    ))}
                  </div>
                  <div>
                    <div className="flex items-center gap-1 text-brass-500">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Icon key={i} name="star" className="h-3.5 w-3.5" />
                      ))}
                      <span className="ml-1 text-xs font-semibold text-ink-700">
                        4.9
                      </span>
                    </div>
                    <p className="text-xs text-ink-600">
                      Dipercaya musisi lokal
                    </p>
                  </div>
                </div>
                <div className="h-8 w-px bg-ink-900/10" />
                <div>
                  <p className="font-display text-lg font-bold text-ink-900">
                    {Math.max(1200, orderCount * 137).toLocaleString("id-ID")}+
                  </p>
                  <p className="text-xs text-ink-600">alat pernah dirawat</p>
                </div>
              </div>
            </div>

            <div className="relative mx-auto w-full max-w-md animate-fade-up lg:max-w-none">
              <div className="absolute -inset-6 -z-10 rounded-[2.5rem] bg-gradient-to-br from-brass-300/40 via-transparent to-ink-900/10 blur-2xl" />
              <div className="relative rounded-[2rem] border border-ink-900/10 bg-white p-5 shadow-soft sm:p-7">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-[0.65rem] font-bold uppercase tracking-[0.2em] text-ink-500">
                      Service Order
                    </p>
                    <p className="mt-1 font-mono text-lg font-semibold text-ink-900">
                      SO-2026-00024
                    </p>
                  </div>
                  <span className="badge bg-cyan-100 text-cyan-800 ring-cyan-300">
                    Dalam Pengerjaan
                  </span>
                </div>

                <div className="mt-5 flex items-center gap-4 rounded-2xl bg-[#f3ecdf] p-4">
                  <InstrumentArt name="Gitar" className="h-16 w-16" />
                  <div className="min-w-0">
                    <p className="font-semibold text-ink-900">Gitar Yamaha F310</p>
                    <p className="mt-0.5 text-sm text-ink-600">
                      Setup ulang & perbaikan fret
                    </p>
                    <p className="mt-2 text-xs font-semibold text-brass-700">
                      Estimasi selesai: besok, 15.00
                    </p>
                  </div>
                </div>

                <div className="mt-5 space-y-3">
                  {[
                    ["Booking diterima", true],
                    ["Alat diterima & diagnosis", true],
                    ["Persetujuan biaya", true],
                    ["Sedang dikerjakan", "active"],
                    ["Siap diambil", false],
                  ].map(([label, state], i) => (
                    <div key={i} className="flex items-center gap-3">
                      <span
                        className={
                          state === true
                            ? "grid h-6 w-6 place-items-center rounded-full bg-emerald-100 text-emerald-700"
                            : state === "active"
                              ? "relative grid h-6 w-6 place-items-center rounded-full bg-brass-500 text-ink-950"
                              : "grid h-6 w-6 place-items-center rounded-full border border-ink-900/15 bg-white text-ink-400"
                        }
                      >
                        {state === true ? (
                          <Icon name="check" className="h-3.5 w-3.5" />
                        ) : (
                          <span
                            className={
                              state === "active"
                                ? "h-2 w-2 animate-pulse rounded-full bg-ink-950"
                                : "h-1.5 w-1.5 rounded-full bg-current"
                            }
                          />
                        )}
                      </span>
                      <span
                        className={
                          state === false
                            ? "text-sm text-ink-500"
                            : "text-sm font-medium text-ink-800"
                        }
                      >
                        {label}
                      </span>
                      {state === "active" ? (
                        <span className="ml-auto text-[0.65rem] font-semibold uppercase tracking-wide text-brass-700">
                          sekarang
                        </span>
                      ) : null}
                    </div>
                  ))}
                </div>

                <div className="mt-5 flex items-center justify-between rounded-xl bg-ink-900 px-4 py-3 text-white">
                  <div>
                    <p className="text-[0.65rem] uppercase tracking-wider text-slate-400">
                      Estimasi biaya
                    </p>
                    <p className="font-display text-xl font-bold">
                      {formatIDR(285000)}
                    </p>
                  </div>
                  <span className="rounded-lg bg-white/10 px-2.5 py-1 text-xs text-slate-300">
                    DP 30%
                  </span>
                </div>
              </div>

              <div className="absolute -bottom-6 -left-2 hidden w-44 rounded-2xl border border-ink-900/10 bg-white p-3.5 shadow-soft sm:block">
                <div className="flex items-center gap-2">
                  <span className="grid h-8 w-8 place-items-center rounded-lg bg-emerald-100 text-emerald-700">
                    <Icon name="shield" className="h-4 w-4" />
                  </span>
                  <div>
                    <p className="text-xs font-semibold text-ink-900">
                      Garansi servis
                    </p>
                    <p className="text-[0.65rem] text-ink-500">14 hari</p>
                  </div>
                </div>
              </div>
              <div className="absolute -right-2 -top-5 hidden rounded-2xl border border-ink-900/10 bg-white px-4 py-3 shadow-soft sm:block">
                <p className="text-[0.6rem] font-semibold uppercase tracking-wider text-ink-500">
                  Update via
                </p>
                <p className="mt-1 flex items-center gap-1.5 text-xs font-semibold text-ink-900">
                  <Icon name="whatsapp" className="h-4 w-4 text-emerald-600" />
                  WhatsApp
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="border-y border-ink-900/10 bg-white/60">
          <div className="mx-auto grid max-w-6xl grid-cols-2 divide-x divide-ink-900/10 px-4 py-6 sm:grid-cols-4 sm:px-6">
            {[
              ["Diagnosis transparan", "Biaya disetujui sebelum servis"],
              ["Teknisi berpengalaman", "Spesialis gitar hingga audio"],
              ["Update berkala", "Pantau status lewat nomor servis"],
              ["Spare part jelas", "Pemakaian part tercatat"],
            ].map(([title, desc], i) => (
              <div
                key={title}
                className={
                  i < 2
                    ? "px-4 py-3 sm:px-6"
                    : "border-t border-ink-900/10 px-4 py-3 sm:border-t-0 sm:px-6"
                }
              >
                <p className="text-sm font-semibold text-ink-900">{title}</p>
                <p className="mt-0.5 text-xs leading-relaxed text-ink-600">
                  {desc}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <PublicBadge>Layanan</PublicBadge>
              <h2 className="mt-4 font-display text-3xl font-bold tracking-tight text-ink-950 sm:text-4xl">
                Dari setelan halus sampai reparasi besar
              </h2>
              <p className="mt-3 max-w-2xl text-sm leading-relaxed text-ink-600 sm:text-base">
                Harga transparan, pengerjaan teliti. Pilih layanan yang paling
                sesuai, atau konsultasikan keluhan alat Anda lebih dulu.
              </p>
            </div>
            <Link href="/layanan" className="btn-outline">
              Semua Layanan
              <Icon name="arrow-right" className="h-4 w-4" />
            </Link>
          </div>

          <div className="mt-9 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {services.map((service) => (
              <Link
                key={service.id}
                href={`/booking?service=${service.id}`}
                className="group relative overflow-hidden rounded-2xl border border-ink-900/10 bg-white p-5 transition-all hover:-translate-y-0.5 hover:border-brass-400/50 hover:shadow-lg"
              >
                <div className="flex items-start justify-between gap-4">
                  <span className="grid h-11 w-11 place-items-center rounded-xl bg-[#f3ecdf] text-brass-700">
                    <Icon name="tune" className="h-5 w-5" />
                  </span>
                  <span className="chip">{service.category}</span>
                </div>
                <h3 className="mt-4 font-display text-xl font-bold text-ink-900">
                  {service.name}
                </h3>
                <p className="mt-1.5 line-clamp-2 text-sm leading-relaxed text-ink-600">
                  {service.description}
                </p>
                <div className="mt-4 flex items-end justify-between border-t border-ink-900/10 pt-3">
                  <div>
                    <p className="text-[0.65rem] uppercase tracking-wider text-ink-500">
                      Mulai dari
                    </p>
                    <p className="font-display text-lg font-bold text-ink-900">
                      {formatIDR(service.price)}
                    </p>
                  </div>
                  <span className="flex items-center gap-1 text-xs font-semibold text-ink-600">
                    <Icon name="clock" className="h-3.5 w-3.5" />
                    {service.durationMin} menit
                  </span>
                </div>
                <span className="absolute bottom-5 right-5 grid h-8 w-8 place-items-center rounded-full bg-ink-900 text-brass-300 opacity-0 transition-opacity group-hover:opacity-100">
                  <Icon name="arrow-right" className="h-4 w-4" />
                </span>
              </Link>
            ))}
          </div>
        </section>

        <section className="bg-ink-950 py-16 text-white sm:py-24">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
              <div>
                <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[0.7rem] font-semibold uppercase tracking-wider text-brass-300">
                  <Icon name="sparkles" className="h-3.5 w-3.5" />
                  Alur sederhana
                </span>
                <h2 className="mt-4 font-display text-3xl font-bold sm:text-4xl">
                  Empat langkah menuju alat yang siap tampil
                </h2>
                <p className="mt-3 max-w-lg text-sm leading-relaxed text-slate-400">
                  Tidak perlu antre lama atau menebak-nebak biaya. Semua tercatat
                  dan bisa dipantau dari HP.
                </p>
                <div className="mt-8 flex flex-wrap gap-2">
                  {instruments.map((item) => (
                    <span
                      key={item}
                      className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-slate-300"
                    >
                      <Icon
                        name={instrumentIcon(item)}
                        className="h-3.5 w-3.5 text-brass-400"
                      />
                      {item}
                    </span>
                  ))}
                </div>
              </div>

              <ol className="relative space-y-4">
                {steps.map((step, i) => (
                  <li
                    key={step.title}
                    className="flex gap-4 rounded-2xl border border-white/10 bg-white/[0.04] p-4"
                  >
                    <div className="flex flex-col items-center">
                      <span className="grid h-10 w-10 place-items-center rounded-xl bg-brass-500/15 text-brass-300">
                        <Icon name={step.icon} className="h-5 w-5" />
                      </span>
                      {i < steps.length - 1 ? (
                        <span className="mt-2 h-full w-px flex-1 bg-gradient-to-b from-brass-400/40 to-transparent" />
                      ) : null}
                    </div>
                    <div className="pb-1">
                      <p className="text-[0.65rem] font-semibold uppercase tracking-wider text-slate-500">
                        Langkah {i + 1}
                      </p>
                      <p className="mt-0.5 font-semibold text-white">
                        {step.title}
                      </p>
                      <p className="mt-1 text-sm leading-relaxed text-slate-400">
                        {step.desc}
                      </p>
                    </div>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
          <div className="grid items-start gap-10 lg:grid-cols-2">
            <div className="lg:sticky lg:top-24">
              <PublicBadge>Kenapa BagusMusik</PublicBadge>
              <h2 className="mt-4 font-display text-3xl font-bold tracking-tight text-ink-950 sm:text-4xl">
                Perawatan yang bisa Anda percaya
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-ink-600 sm:text-base">
                Alat musik bukan sekadar barang. Kami memperlakukannya seperti
                instrumen panggung: detail, bersih, dan siap dimainkan.
              </p>
              <div className="mt-8 overflow-hidden rounded-3xl border border-ink-900/10 bg-ink-900 p-6 text-white">
                <div className="flex gap-5">
                  <div className="flex-1">
                    <p className="text-[0.65rem] font-semibold uppercase tracking-wider text-brass-300">
                      Scan & booking
                    </p>
                    <p className="mt-2 font-display text-2xl font-bold">
                      Satu pindai, langsung terhubung.
                    </p>
                    <p className="mt-2 text-sm leading-relaxed text-slate-400">
                      QR di toko, meja penerimaan, atau nota membuka alur booking
                      dan cek status tanpa unduh aplikasi.
                    </p>
                    <Link
                      href="/booking"
                      className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-brass-300 hover:text-brass-200"
                    >
                      Coba sekarang <Icon name="arrow-right" className="h-4 w-4" />
                    </Link>
                  </div>
                  <div
                    className="hidden w-36 shrink-0 rounded-2xl bg-white p-2.5 sm:block [&>svg]:h-full [&>svg]:w-full"
                    dangerouslySetInnerHTML={{ __html: qrSvg }}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-4">
              {[
                {
                  icon: "shield" as const,
                  title: "Diagnosis sebelum biaya",
                  desc: "Kami jelaskan temuan dan opsi perbaikan sebelum Anda menyetujui estimasi. Tidak ada biaya kejutan.",
                },
                {
                  icon: "package" as const,
                  title: "Spare part tercatat",
                  desc: "Setiap part yang dipakai tercatat di work order dan mengurangi stok secara otomatis.",
                },
                {
                  icon: "activity" as const,
                  title: "Status yang bisa dipantau",
                  desc: "Gunakan nomor servis untuk melihat perkembangan: diterima, diagnosis, dikerjakan, hingga siap diambil.",
                },
                {
                  icon: "whatsapp" as const,
                  title: "Komunikasi langsung",
                  desc: "Kanal utama kami WhatsApp. Tanyakan progres atau minta rekomendasi perawatan tanpa menunggu lama.",
                },
              ].map((item) => (
                <div
                  key={item.title}
                  className="flex gap-4 rounded-2xl border border-ink-900/10 bg-white/70 p-5"
                >
                  <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-ink-900 text-brass-300">
                    <Icon name={item.icon} className="h-5 w-5" />
                  </span>
                  <div>
                    <p className="font-semibold text-ink-900">{item.title}</p>
                    <p className="mt-1 text-sm leading-relaxed text-ink-600">
                      {item.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="border-y border-ink-900/10 bg-white/60 py-16 sm:py-20">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <PublicBadge>Cerita pelanggan</PublicBadge>
                <h2 className="mt-4 font-display text-3xl font-bold tracking-tight text-ink-950 sm:text-4xl">
                  Sudah kembali berbunyi
                </h2>
              </div>
              <p className="max-w-sm text-sm text-ink-600">
                Cerita nyata dari musisi, pengajar, dan pemilik studio yang
                mempercayakan alatnya kepada kami.
              </p>
            </div>
            <div className="mt-8 grid gap-4 md:grid-cols-3">
              {testimonials.map((t) => (
                <figure
                  key={t.name}
                  className="flex flex-col rounded-2xl border border-ink-900/10 bg-white p-5"
                >
                  <div className="flex gap-0.5 text-brass-500">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Icon key={i} name="star" className="h-4 w-4" />
                    ))}
                  </div>
                  <blockquote className="mt-3 flex-1 text-sm leading-relaxed text-ink-700">
                    &ldquo;{t.quote}&rdquo;
                  </blockquote>
                  <figcaption className="mt-4 flex items-center gap-3 border-t border-ink-900/10 pt-4">
                    <span className="grid h-9 w-9 place-items-center rounded-full bg-ink-900 text-xs font-bold text-brass-300">
                      {initials(t.name)}
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-ink-900">
                        {t.name}
                      </p>
                      <p className="text-xs text-ink-500">{t.role}</p>
                    </div>
                  </figcaption>
                </figure>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
          <div className="relative overflow-hidden rounded-3xl bg-brass-500 px-6 py-12 text-ink-950 sm:px-12">
            <div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-white/20 blur-2xl" />
            <div className="pointer-events-none absolute -bottom-24 left-10 h-64 w-64 rounded-full bg-ink-900/10 blur-2xl" />
            <div className="relative grid gap-6 md:grid-cols-[1.4fr_0.6fr] md:items-center">
              <div>
                <h2 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
                  Alatnya sudah menunggu untuk dimainkan.
                </h2>
                <p className="mt-3 max-w-xl text-sm leading-relaxed text-ink-800">
                  Mulai dengan booking gratis. Tim kami akan mengonfirmasi jadwal
                  dan menyiapkan pemeriksaan awal untuk alat Anda.
                </p>
                <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                  <Link href="/booking" className="btn-dark">
                    <Icon name="calendar" className="h-4 w-4" />
                    Booking Sekarang
                  </Link>
                  <a
                    href={`https://wa.me/${settings.whatsapp.replace(/^0/, "62").replace(/\D/g, "")}`}
                    target="_blank"
                    rel="noreferrer"
                    className="btn-outline border-ink-950/20 bg-white/50"
                  >
                    <Icon name="whatsapp" className="h-4 w-4" />
                    Hubungi via WhatsApp
                  </a>
                </div>
              </div>
              <div className="rounded-2xl border border-ink-950/10 bg-white/30 p-4 backdrop-blur">
                <p className="text-[0.65rem] font-bold uppercase tracking-wider text-ink-800">
                  Jam operasional
                </p>
                <p className="mt-1 font-display text-lg font-bold text-ink-950">
                  {settings.openingHours}
                </p>
                <p className="mt-3 text-xs leading-relaxed text-ink-800">
                  {settings.address}
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <PublicFooter settings={settings} />
      <InstallPrompt />
    </div>
  );
}
