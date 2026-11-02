import Link from "next/link";
import { Brand } from "./brand";
import { Icon } from "./icons";
import type { BusinessSettings } from "@/lib/settings";

export function PublicFooter({ settings }: { settings: BusinessSettings }) {
  const wa = settings.whatsapp.replace(/^0/, "62").replace(/\D/g, "");
  return (
    <footer id="kontak" className="border-t border-ink-900/10 bg-ink-950 text-slate-300">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 sm:px-6 md:grid-cols-2 lg:grid-cols-4">
        <div className="lg:col-span-2">
          <Brand light />
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-slate-400">
            {settings.tagline}. Kami merawat setiap alat musik dengan teliti,
            transparan, dan dikerjakan teknisi berpengalaman.
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-300">
              Gitar & Bass
            </span>
            <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-300">
              Keyboard
            </span>
            <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-300">
              Drum
            </span>
            <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-300">
              Audio & Mic
            </span>
          </div>
        </div>

        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Navigasi
          </p>
          <ul className="mt-4 space-y-2 text-sm">
            <li>
              <Link href="/layanan" className="hover:text-brass-300">
                Katalog Layanan
              </Link>
            </li>
            <li>
              <Link href="/booking" className="hover:text-brass-300">
                Booking Servis
              </Link>
            </li>
            <li>
              <Link href="/cek-status" className="hover:text-brass-300">
                Cek Status Servis
              </Link>
            </li>
            <li>
              <Link href="/login" className="hover:text-brass-300">
                Login Staf
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Hubungi Kami
          </p>
          <ul className="mt-4 space-y-3 text-sm">
            <li className="flex gap-2">
              <Icon name="map-pin" className="mt-0.5 h-4 w-4 text-brass-400" />
              <span>{settings.address}</span>
            </li>
            <li className="flex gap-2">
              <Icon name="clock" className="mt-0.5 h-4 w-4 text-brass-400" />
              <span>{settings.openingHours}</span>
            </li>
            <li>
              <a
                href={`https://wa.me/${wa}`}
                target="_blank"
                rel="noreferrer"
                className="flex gap-2 hover:text-brass-300"
              >
                <Icon name="whatsapp" className="mt-0.5 h-4 w-4 text-brass-400" />
                <span>{settings.phone}</span>
              </a>
            </li>
            <li className="flex gap-2">
              <Icon name="file" className="mt-0.5 h-4 w-4 text-brass-400" />
              <span>{settings.email}</span>
            </li>
          </ul>
        </div>
      </div>
      <div className="border-t border-white/10">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-5 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <p>
            &copy; {new Date().getFullYear()} {settings.businessName}. Seluruh hak
            cipta dilindungi.
          </p>
          <p>Dibuat untuk pecinta musik, dari musisi untuk musisi.</p>
        </div>
      </div>
    </footer>
  );
}
