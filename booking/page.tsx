import type { Metadata } from "next";
import { prisma } from "@/lib/db";
import { getSettings } from "@/lib/settings";
import { PublicHeader } from "@/components/public-header";
import { PublicFooter } from "@/components/public-footer";
import { BookingWizard } from "@/components/booking-wizard";
import { PublicBadge } from "@/components/ui";
import { Icon } from "@/components/icons";
import { toNumber } from "@/lib/utils";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Booking Servis",
  description:
    "Ajukan booking servis alat musik secara online. Isi data alat, keluhan, dan jadwal kedatangan.",
};

export default async function BookingPage({
  searchParams,
}: {
  searchParams: Promise<{ service?: string; src?: string }>;
}) {
  const { service, src } = await searchParams;
  const [settings, services] = await Promise.all([
    getSettings(),
    prisma.service.findMany({
      where: { active: true },
      orderBy: [{ category: "asc" }, { name: "asc" }],
    }),
  ]);

  const serviceOptions = services.map((s) => ({
    id: s.id,
    name: s.name,
    category: s.category,
    price: toNumber(s.price),
    durationMin: s.durationMin,
  }));

  const initialServiceId =
    service && services.some((s) => s.id === service) ? service : "";

  return (
    <div className="min-h-dvh">
      <PublicHeader />
      <main>
        <section className="border-b border-ink-900/10">
          <div className="mx-auto grid max-w-6xl gap-6 px-4 py-10 sm:px-6 sm:py-14 lg:grid-cols-[1fr_auto] lg:items-end">
            <div>
              <PublicBadge>Booking Servis</PublicBadge>
              <h1 className="mt-4 font-display text-4xl font-bold tracking-tight text-ink-950 sm:text-5xl">
                Ceritakan alat & keluhannya
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-relaxed text-ink-600 sm:text-base">
                Isi dalam 3 langkah singkat. Setelah terkirim, Anda akan
                mendapatkan nomor booking untuk cek status dan komunikasi dengan
                tim kami.
              </p>
            </div>
            <div className="flex flex-wrap gap-4 text-sm">
              <div className="flex items-center gap-2 text-ink-700">
                <span className="grid h-9 w-9 place-items-center rounded-lg bg-white text-brass-700 ring-1 ring-ink-900/10">
                  <Icon name="shield" className="h-4 w-4" />
                </span>
                <span>Data aman</span>
              </div>
              <div className="flex items-center gap-2 text-ink-700">
                <span className="grid h-9 w-9 place-items-center rounded-lg bg-white text-brass-700 ring-1 ring-ink-900/10">
                  <Icon name="clock" className="h-4 w-4" />
                </span>
                <span>Konfirmasi cepat</span>
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
          <BookingWizard
            services={serviceOptions}
            initialServiceId={initialServiceId}
            source={src || "web"}
            settings={{
              whatsapp: settings.whatsapp,
              phone: settings.phone,
              openingHours: settings.openingHours,
              bookingMode: settings.bookingMode,
              dpNominal: settings.dpNominal,
              dpPercent: settings.dpPercent,
              paymentDeadlineHours: settings.paymentDeadlineHours,
              cancellationPolicy: settings.cancellationPolicy,
            }}
          />
        </section>
      </main>
      <PublicFooter settings={settings} />
    </div>
  );
}
