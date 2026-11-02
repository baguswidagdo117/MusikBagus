import Link from "next/link";
import type { Metadata } from "next";
import { prisma } from "@/lib/db";
import { getSettings } from "@/lib/settings";
import { formatIDR } from "@/lib/utils";
import { PublicHeader } from "@/components/public-header";
import { PublicFooter } from "@/components/public-footer";
import { Icon } from "@/components/icons";
import { PublicBadge } from "@/components/ui";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Katalog Layanan",
  description:
    "Daftar layanan servis dan reparasi alat musik BagusMusik: setup gitar, ganti senar, servis keyboard, drum, amplifier, dan mikrofon.",
};

export default async function ServicesPage({
  searchParams,
}: {
  searchParams: Promise<{ kategori?: string }>;
}) {
  const { kategori } = await searchParams;
  const [settings, services] = await Promise.all([
    getSettings(),
    prisma.service.findMany({
      where: { active: true },
      orderBy: [{ category: "asc" }, { price: "asc" }],
    }),
  ]);

  const categories = Array.from(new Set(services.map((s) => s.category)));
  const active = kategori && categories.includes(kategori) ? kategori : null;
  const filtered = active
    ? services.filter((s) => s.category === active)
    : services;

  return (
    <div className="min-h-dvh">
      <PublicHeader />
      <main>
        <section className="border-b border-ink-900/10">
          <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
            <PublicBadge>Katalog</PublicBadge>
            <h1 className="mt-4 max-w-3xl font-display text-4xl font-bold tracking-tight text-ink-950 sm:text-5xl">
              Layanan servis dengan harga yang jelas
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-relaxed text-ink-600 sm:text-base">
              Harga di bawah adalah estimasi awal. Setelah diagnosis, teknisi
              akan memberikan rincian biaya dan Anda dapat menyetujuinya sebelum
              pengerjaan dimulai.
            </p>
            <div className="mt-7 flex flex-wrap gap-2">
              <Link
                href="/layanan"
                className={cn("chip", !active && "border-ink-900 bg-ink-900 text-white")}
              >
                Semua
              </Link>
              {categories.map((category) => (
                <Link
                  key={category}
                  href={`/layanan?kategori=${encodeURIComponent(category)}`}
                  className={cn(
                    "chip",
                    active === category && "border-ink-900 bg-ink-900 text-white",
                  )}
                >
                  {category}
                </Link>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
          <div className="grid gap-4 md:grid-cols-2">
            {filtered.map((service) => (
              <div
                key={service.id}
                className="group flex flex-col rounded-2xl border border-ink-900/10 bg-white p-5 transition-all hover:border-brass-400/60 hover:shadow-lg sm:flex-row sm:items-start sm:gap-5"
              >
                <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-[#f3ecdf] text-brass-700">
                  <Icon name="tune" className="h-6 w-6" />
                </span>
                <div className="mt-4 min-w-0 flex-1 sm:mt-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="font-display text-xl font-bold text-ink-900">
                      {service.name}
                    </h2>
                    <span className="chip">{service.category}</span>
                  </div>
                  <p className="mt-1.5 text-sm leading-relaxed text-ink-600">
                    {service.description}
                  </p>
                  <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-ink-500">
                    <span className="flex items-center gap-1">
                      <Icon name="clock" className="h-3.5 w-3.5" />
                      Estimasi {service.durationMin} menit
                    </span>
                    <span className="font-mono text-[0.7rem] text-ink-400">
                      {service.code}
                    </span>
                  </div>
                </div>
                <div className="mt-4 shrink-0 border-t border-ink-900/10 pt-3 sm:mt-0 sm:border-l sm:border-t-0 sm:pl-5 sm:pt-0">
                  <p className="text-[0.65rem] uppercase tracking-wider text-ink-500">
                    Mulai dari
                  </p>
                  <p className="font-display text-xl font-bold text-ink-950">
                    {formatIDR(service.price)}
                  </p>
                  <Link
                    href={`/booking?service=${service.id}`}
                    className="btn-primary btn-sm mt-3 w-full"
                  >
                    Booking
                    <Icon name="arrow-right" className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
          {filtered.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-ink-900/20 bg-white/60 py-16 text-center">
              <p className="font-semibold text-ink-900">
                Belum ada layanan pada kategori ini.
              </p>
              <Link href="/layanan" className="btn-outline mt-4">
                Lihat semua layanan
              </Link>
            </div>
          ) : null}

          <div className="mt-10 rounded-2xl bg-ink-950 p-6 text-white sm:flex sm:items-center sm:justify-between sm:p-8">
            <div>
              <p className="font-display text-2xl font-bold">
                Keluhan belum ada di daftar?
              </p>
              <p className="mt-2 max-w-xl text-sm text-slate-400">
                Konsultasikan dulu. Kami akan mengarahkan ke layanan yang tepat
                atau membuat estimasi khusus setelah pemeriksaan.
              </p>
            </div>
            <div className="mt-5 flex flex-col gap-2 sm:mt-0 sm:flex-row">
              <a
                href={`https://wa.me/${settings.whatsapp.replace(/^0/, "62").replace(/\D/g, "")}`}
                target="_blank"
                rel="noreferrer"
                className="btn-primary"
              >
                <Icon name="whatsapp" className="h-4 w-4" />
                Tanya via WhatsApp
              </a>
              <Link href="/cek-status" className="btn-outline border-white/20 bg-white/5 text-white hover:bg-white/10">
                Cek Status
              </Link>
            </div>
          </div>
        </section>
      </main>
      <PublicFooter settings={settings} />
    </div>
  );
}
