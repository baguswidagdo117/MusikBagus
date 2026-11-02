import Link from "next/link";
import { Brand } from "@/components/brand";
import { Icon } from "@/components/icons";

export const metadata = { title: "Tidak Ada Koneksi" };

export default function OfflinePage() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center bg-paper px-6 py-16 text-center">
      <Brand />
      <div className="mt-12 grid h-20 w-20 place-items-center rounded-full bg-ink-900 text-brass-300">
        <Icon name="alert" className="h-9 w-9" />
      </div>
      <h1 className="mt-6 font-display text-3xl font-bold text-ink-900">
        Tidak ada koneksi
      </h1>
      <p className="mt-2 max-w-sm text-sm leading-relaxed text-ink-600">
        Periksa koneksi internet Anda, lalu coba muat ulang halaman. Data
        booking dan status servis membutuhkan koneksi agar selalu terbaru.
      </p>
      <Link href="/" className="btn-primary mt-8 w-full max-w-xs">
        <Icon name="refresh" className="h-4 w-4" />
        Coba Lagi
      </Link>
    </main>
  );
}
