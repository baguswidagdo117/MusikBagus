"use client";

import Link from "next/link";
import { useState } from "react";
import { Brand } from "./brand";
import { Icon } from "./icons";
import { cn } from "@/lib/utils";

const links = [
  { href: "/layanan", label: "Layanan" },
  { href: "/booking", label: "Booking" },
  { href: "/cek-status", label: "Cek Status" },
  { href: "/#kontak", label: "Kontak" },
];

export function PublicHeader() {
  const [open, setOpen] = useState(false);
  return (
    <header className="sticky top-0 z-50 border-b border-ink-900/10 bg-[#f8f4ec]/90 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <Brand />
        <nav className="hidden items-center gap-1 md:flex">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-lg px-3 py-2 text-sm font-semibold text-ink-700 transition-colors hover:bg-ink-900/5 hover:text-ink-900"
            >
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <Link
            href="/booking"
            className="btn-primary hidden sm:inline-flex"
          >
            Booking Servis
            <Icon name="arrow-right" className="h-4 w-4" />
          </Link>
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="grid h-11 w-11 place-items-center rounded-xl border border-ink-900/10 bg-white/70 text-ink-900 md:hidden"
            aria-label="Buka menu"
            aria-expanded={open}
          >
            <Icon name={open ? "x" : "menu"} />
          </button>
        </div>
      </div>
      <div
        className={cn(
          "overflow-hidden border-t border-ink-900/5 bg-[#f8f4ec] transition-[max-height] duration-300 md:hidden",
          open ? "max-h-96" : "max-h-0",
        )}
      >
        <nav className="mx-auto grid max-w-6xl gap-1 px-4 py-3">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setOpen(false)}
              className="flex min-h-11 items-center justify-between rounded-lg px-3 text-sm font-semibold text-ink-800 hover:bg-ink-900/5"
            >
              {link.label}
              <Icon name="chevron-right" className="h-4 w-4 text-ink-600" />
            </Link>
          ))}
          <Link
            href="/booking"
            onClick={() => setOpen(false)}
            className="btn-primary mt-2 w-full"
          >
            Booking Servis
          </Link>
        </nav>
      </div>
    </header>
  );
}
