import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { roleHome } from "@/lib/permissions";
import { Brand } from "@/components/brand";
import { Icon } from "@/components/icons";
import { LoginForm } from "@/components/login-form";

export const metadata: Metadata = {
  title: "Login Staf",
  robots: { index: false, follow: false },
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const session = await getSession();
  if (session) redirect(roleHome(session.role));
  const { next } = await searchParams;

  return (
    <main className="grid min-h-dvh lg:grid-cols-[1.05fr_0.95fr]">
      <section className="relative hidden overflow-hidden bg-ink-950 p-10 text-white lg:flex lg:flex-col lg:justify-between">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -left-24 top-1/4 h-80 w-80 rounded-full bg-brass-500/10 blur-3xl" />
          <div className="absolute -right-32 bottom-0 h-96 w-96 rounded-full bg-sky-500/10 blur-3xl" />
          <div
            className="absolute inset-0 opacity-[0.04]"
            style={{
              backgroundImage:
                "radial-gradient(circle at 1px 1px, white 1px, transparent 0)",
              backgroundSize: "28px 28px",
            }}
          />
        </div>
        <div className="relative">
          <Brand light />
        </div>
        <div className="relative max-w-lg">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[0.7rem] font-semibold uppercase tracking-wider text-brass-300">
            <Icon name="shield" className="h-3.5 w-3.5" />
            Workspace Staf
          </span>
          <h1 className="mt-5 font-display text-4xl font-bold leading-tight">
            Satu ruang kerja untuk seluruh operasional bengkel musik.
          </h1>
          <p className="mt-4 text-sm leading-relaxed text-slate-400">
            Kelola booking, work order, teknisi, POS, stok, dan laporan tanpa
            berpindah aplikasi. Hak akses mengikuti peran masing-masing.
          </p>
          <ul className="mt-8 space-y-3 text-sm text-slate-300">
            {[
              "Owner melihat laporan & audit",
              "Admin mengelola operasional harian",
              "Kasir menangani pembayaran & invoice",
              "Teknisi fokus pada pekerjaan servis",
            ].map((item) => (
              <li key={item} className="flex items-center gap-3">
                <span className="grid h-6 w-6 place-items-center rounded-full bg-brass-500/15 text-brass-300">
                  <Icon name="check" className="h-3.5 w-3.5" />
                </span>
                {item}
              </li>
            ))}
          </ul>
        </div>
        <div className="relative flex items-center gap-3 text-xs text-slate-500">
          <Icon name="shield" className="h-4 w-4" />
          Sesi dilindungi JWT, refresh token, dan RBAC.
        </div>
      </section>

      <section className="flex min-h-dvh flex-col bg-paper">
        <div className="flex items-center justify-between px-5 py-5 sm:px-8">
          <div className="lg:hidden">
            <Brand />
          </div>
          <Link
            href="/"
            className="ml-auto inline-flex items-center gap-1.5 text-sm font-semibold text-ink-600 hover:text-ink-950"
          >
            <Icon name="arrow-left" className="h-4 w-4" />
            Website
          </Link>
        </div>
        <div className="flex flex-1 items-center justify-center px-4 py-6 sm:px-8">
          <div className="w-full max-w-md">
            <div className="rounded-3xl border border-ink-900/10 bg-white p-6 shadow-soft sm:p-8">
              <p className="text-[0.7rem] font-bold uppercase tracking-[0.18em] text-brass-700">
                Masuk
              </p>
              <h2 className="mt-2 font-display text-3xl font-bold text-ink-950">
                Selamat datang kembali
              </h2>
              <p className="mt-1.5 text-sm text-ink-600">
                Gunakan akun staf BagusMusik untuk melanjutkan.
              </p>
              <LoginForm next={next} />
            </div>

            <div className="mt-4 rounded-2xl border border-ink-900/10 bg-white/60 p-4">
              <p className="text-[0.65rem] font-bold uppercase tracking-wider text-ink-500">
                Akun demo
              </p>
              <div className="mt-2 grid grid-cols-2 gap-1.5 text-xs">
                {[
                  ["Owner", "owner@bagusmusik.id", "owner123"],
                  ["Admin", "admin@bagusmusik.id", "admin123"],
                  ["Kasir", "kasir@bagusmusik.id", "kasir123"],
                  ["Teknisi", "teknisi@bagusmusik.id", "teknisi123"],
                ].map(([role, email, password]) => (
                  <div
                    key={role}
                    className="rounded-lg border border-ink-900/10 bg-white px-2.5 py-2"
                  >
                    <p className="font-semibold text-ink-800">{role}</p>
                    <p className="truncate font-mono text-[0.65rem] text-ink-500">
                      {email}
                    </p>
                    <p className="font-mono text-[0.65rem] text-ink-500">
                      {password}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <p className="mt-4 text-center text-xs leading-relaxed text-ink-500">
              Halaman ini khusus staf. Pelanggan tidak perlu login untuk{" "}
              <Link href="/booking" className="link-underline">
                booking
              </Link>{" "}
              atau{" "}
              <Link href="/cek-status" className="link-underline">
                cek status
              </Link>
              .
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
