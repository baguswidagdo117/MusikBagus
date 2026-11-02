"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { Brand, BrandMark } from "../brand";
import { Icon, type IconName } from "../icons";
import { cn, initials } from "@/lib/utils";
import { ROLE_LABEL } from "@/lib/permissions";
import type { SessionUser } from "@/lib/session";

type NavItem = {
  href: string;
  label: string;
  icon: IconName;
  permission: string;
  group: "Operasional" | "Data" | "Insight";
};

const NAV: NavItem[] = [
  { href: "/admin", label: "Dashboard", icon: "home", permission: "BOOKING_VIEW", group: "Operasional" },
  { href: "/admin/bookings", label: "Booking", icon: "clipboard", permission: "BOOKING_VIEW", group: "Operasional" },
  { href: "/admin/work-orders", label: "Work Order", icon: "wrench", permission: "WORKORDER_VIEW", group: "Operasional" },
  { href: "/admin/pos", label: "POS / Kasir", icon: "receipt", permission: "POS_VIEW", group: "Operasional" },
  { href: "/admin/customers", label: "Pelanggan", icon: "users", permission: "CUSTOMER_VIEW", group: "Data" },
  { href: "/admin/inventory", label: "Inventaris", icon: "box", permission: "INVENTORY_VIEW", group: "Data" },
  { href: "/admin/suppliers", label: "Supplier", icon: "truck", permission: "SUPPLIER_VIEW", group: "Data" },
  { href: "/admin/services", label: "Layanan", icon: "tune", permission: "SERVICE_VIEW", group: "Data" },
  { href: "/admin/reports", label: "Laporan", icon: "chart", permission: "REPORT_VIEW", group: "Insight" },
  { href: "/admin/qr", label: "QR Code", icon: "qr", permission: "BOOKING_VIEW", group: "Insight" },
  { href: "/admin/settings", label: "Pengaturan", icon: "settings", permission: "SETTING_MANAGE", group: "Insight" },
  { href: "/admin/audit", label: "Audit Log", icon: "history", permission: "AUDIT_VIEW", group: "Insight" },
  { href: "/admin/users", label: "Pengguna", icon: "shield", permission: "USER_MANAGE", group: "Insight" },
];

export function AdminShell({
  user,
  permissions,
  notificationCount,
  children,
}: {
  user: SessionUser;
  permissions: string[];
  notificationCount: number;
  children: ReactNode;
}) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const [userOpen, setUserOpen] = useState(false);

  const allowed = NAV.filter((item) => permissions.includes(item.permission));
  const primary = allowed.filter((item) =>
    ["/admin", "/admin/bookings", "/admin/work-orders", "/admin/pos"].includes(
      item.href,
    ),
  );
  const bottomItems = primary.slice(0, 4);

  useEffect(() => {
    setMenuOpen(false);
    setMoreOpen(false);
    setUserOpen(false);
  }, [pathname]);

  const isActive = (href: string) =>
    href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.assign("/login");
  }

  const groups: NavItem["group"][] = ["Operasional", "Data", "Insight"];

  return (
    <div className="min-h-dvh bg-ink-950 text-slate-100">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col border-r border-white/10 bg-ink-950 lg:flex">
        <div className="flex h-16 items-center border-b border-white/10 px-5">
          <Brand href="/admin" light />
        </div>
        <nav className="scrollbar-none flex-1 space-y-5 overflow-y-auto px-3 py-4">
          {groups.map((group) => {
            const items = allowed.filter((item) => item.group === group);
            if (!items.length) return null;
            return (
              <div key={group}>
                <p className="px-3 pb-1.5 text-[0.6rem] font-bold uppercase tracking-[0.18em] text-slate-600">
                  {group}
                </p>
                <div className="space-y-0.5">
                  {items.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                        "group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                        isActive(item.href)
                          ? "bg-brass-500/15 text-brass-200"
                          : "text-slate-400 hover:bg-white/5 hover:text-white",
                      )}
                    >
                      <Icon
                        name={item.icon}
                        className={cn(
                          "h-[18px] w-[18px]",
                          isActive(item.href)
                            ? "text-brass-300"
                            : "text-slate-500 group-hover:text-slate-300",
                        )}
                      />
                      {item.label}
                    </Link>
                  ))}
                </div>
              </div>
            );
          })}
        </nav>
        <div className="border-t border-white/10 p-3">
          <div className="rounded-xl bg-white/[0.04] p-3">
            <p className="truncate text-sm font-semibold text-white">
              {user.name}
            </p>
            <p className="text-xs text-slate-500">{ROLE_LABEL[user.role]}</p>
            <div className="mt-2 flex gap-1.5">
              <Link
                href="/"
                className="flex flex-1 items-center justify-center gap-1 rounded-lg bg-white/5 py-1.5 text-[0.7rem] text-slate-300 hover:bg-white/10"
              >
                <Icon name="external" className="h-3 w-3" />
                Website
              </Link>
              <button
                onClick={logout}
                className="flex flex-1 items-center justify-center gap-1 rounded-lg bg-white/5 py-1.5 text-[0.7rem] text-slate-300 hover:bg-rose-500/20 hover:text-rose-300"
              >
                <Icon name="logout" className="h-3 w-3" />
                Keluar
              </button>
            </div>
          </div>
        </div>
      </aside>

      <div className="lg:pl-64">
        <header className="sticky top-0 z-30 border-b border-white/10 bg-ink-950/85 backdrop-blur-xl">
          <div className="flex h-16 items-center gap-3 px-4 sm:px-6">
            <button
              onClick={() => setMenuOpen(true)}
              className="grid h-10 w-10 place-items-center rounded-xl border border-white/10 text-slate-300 lg:hidden"
              aria-label="Buka menu"
            >
              <Icon name="menu" />
            </button>
            <div className="lg:hidden">
              <BrandMark className="h-9 w-9" />
            </div>
            <div className="hidden min-w-0 flex-1 lg:block">
              <p className="text-xs text-slate-500">BagusMusik Workspace</p>
              <p className="truncate text-sm font-semibold text-white">
                {allowed.find((item) => isActive(item.href))?.label ??
                  "Dashboard"}
              </p>
            </div>
            <div className="ml-auto flex items-center gap-2">
              <Link
                href="/admin/qr"
                className="hidden h-10 items-center gap-2 rounded-xl border border-white/10 px-3 text-xs font-semibold text-slate-300 hover:bg-white/5 sm:flex"
              >
                <Icon name="qr" className="h-4 w-4" />
                QR Access
              </Link>
              <Link
                href="/admin#notifikasi"
                className="relative grid h-10 w-10 place-items-center rounded-xl border border-white/10 text-slate-300 hover:bg-white/5"
                aria-label="Notifikasi"
              >
                <Icon name="bell" className="h-[18px] w-[18px]" />
                {notificationCount > 0 ? (
                  <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-brass-500 px-1 text-[0.6rem] font-bold text-ink-950">
                    {notificationCount}
                  </span>
                ) : null}
              </Link>
              <div className="relative">
                <button
                  onClick={() => setUserOpen((v) => !v)}
                  className="flex h-10 items-center gap-2 rounded-xl border border-white/10 px-2 pr-3 hover:bg-white/5"
                >
                  <span className="grid h-7 w-7 place-items-center rounded-lg bg-brass-500/15 text-[0.65rem] font-bold text-brass-200">
                    {initials(user.name)}
                  </span>
                  <span className="hidden text-left sm:block">
                    <span className="block max-w-[120px] truncate text-xs font-semibold text-white">
                      {user.name}
                    </span>
                    <span className="block text-[0.6rem] text-slate-500">
                      {ROLE_LABEL[user.role]}
                    </span>
                  </span>
                </button>
                {userOpen ? (
                  <>
                    <button
                      className="fixed inset-0 z-40 cursor-default"
                      onClick={() => setUserOpen(false)}
                      aria-label="Tutup menu"
                    />
                    <div className="absolute right-0 top-12 z-50 w-52 rounded-xl border border-white/10 bg-ink-900 p-2 shadow-soft">
                      <div className="border-b border-white/10 px-2 py-2">
                        <p className="truncate text-sm font-semibold text-white">
                          {user.name}
                        </p>
                        <p className="truncate text-xs text-slate-500">
                          {user.email}
                        </p>
                      </div>
                      <Link
                        href="/"
                        className="mt-1 flex items-center gap-2 rounded-lg px-2 py-2 text-sm text-slate-300 hover:bg-white/5"
                      >
                        <Icon name="external" className="h-4 w-4" />
                        Lihat Website
                      </Link>
                      <button
                        onClick={logout}
                        className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-sm text-rose-300 hover:bg-rose-500/10"
                      >
                        <Icon name="logout" className="h-4 w-4" />
                        Keluar
                      </button>
                    </div>
                  </>
                ) : null}
              </div>
            </div>
          </div>
        </header>

        <main className="mx-auto w-full max-w-7xl px-4 pb-24 pt-5 sm:px-6 sm:pt-6 lg:pb-10">
          {children}
        </main>
      </div>

      <nav className="bottom-nav fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-ink-950/95 backdrop-blur-xl lg:hidden">
        <div className="grid grid-cols-5">
          {bottomItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex min-h-14 flex-col items-center justify-center gap-0.5 text-[0.6rem] font-semibold",
                isActive(item.href) ? "text-brass-300" : "text-slate-500",
              )}
            >
              <Icon name={item.icon} className="h-5 w-5" />
              {item.label.split(" ")[0]}
            </Link>
          ))}
          <button
            onClick={() => setMoreOpen(true)}
            className={cn(
              "flex min-h-14 flex-col items-center justify-center gap-0.5 text-[0.6rem] font-semibold",
              moreOpen ? "text-brass-300" : "text-slate-500",
            )}
          >
            <Icon name="menu" className="h-5 w-5" />
            Lainnya
          </button>
        </div>
      </nav>

      {menuOpen ? (
        <div className="fixed inset-0 z-[60] lg:hidden">
          <button
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setMenuOpen(false)}
            aria-label="Tutup menu"
          />
          <div className="absolute inset-y-0 left-0 flex w-72 max-w-[85vw] flex-col border-r border-white/10 bg-ink-950">
            <div className="flex h-16 items-center justify-between border-b border-white/10 px-4">
              <Brand href="/admin" light />
              <button
                onClick={() => setMenuOpen(false)}
                className="grid h-9 w-9 place-items-center rounded-lg text-slate-400 hover:bg-white/5"
                aria-label="Tutup"
              >
                <Icon name="x" />
              </button>
            </div>
            <div className="scrollbar-none flex-1 overflow-y-auto px-3 py-4">
              {groups.map((group) => {
                const items = allowed.filter((item) => item.group === group);
                if (!items.length) return null;
                return (
                  <div key={group} className="mb-5">
                    <p className="px-3 pb-1.5 text-[0.6rem] font-bold uppercase tracking-[0.18em] text-slate-600">
                      {group}
                    </p>
                    {items.map((item) => (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={cn(
                          "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium",
                          isActive(item.href)
                            ? "bg-brass-500/15 text-brass-200"
                            : "text-slate-400 hover:bg-white/5",
                        )}
                      >
                        <Icon name={item.icon} className="h-[18px] w-[18px]" />
                        {item.label}
                      </Link>
                    ))}
                  </div>
                );
              })}
            </div>
            <div className="border-t border-white/10 p-3">
              <button
                onClick={logout}
                className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-sm text-rose-300 hover:bg-rose-500/10"
              >
                <Icon name="logout" className="h-4 w-4" />
                Keluar
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {moreOpen ? (
        <div className="fixed inset-0 z-[60] lg:hidden">
          <button
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setMoreOpen(false)}
            aria-label="Tutup menu"
          />
          <div className="absolute inset-x-0 bottom-0 rounded-t-2xl border-t border-white/10 bg-ink-900 p-4 pb-[calc(env(safe-area-inset-bottom)+1rem)]">
            <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-white/20" />
            <p className="px-1 pb-2 text-[0.65rem] font-bold uppercase tracking-wider text-slate-500">
              Menu lainnya
            </p>
            <div className="grid grid-cols-3 gap-2">
              {allowed
                .filter((item) => !bottomItems.includes(item))
                .map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex flex-col items-center gap-2 rounded-xl border border-white/10 p-3 text-[0.7rem] font-medium",
                      isActive(item.href)
                        ? "border-brass-500/40 bg-brass-500/10 text-brass-200"
                        : "text-slate-400 hover:bg-white/5",
                    )}
                  >
                    <Icon name={item.icon} className="h-5 w-5" />
                    {item.label}
                  </Link>
                ))}
              <button
                onClick={logout}
                className="flex flex-col items-center gap-2 rounded-xl border border-rose-500/20 p-3 text-[0.7rem] font-medium text-rose-300 hover:bg-rose-500/10"
              >
                <Icon name="logout" className="h-5 w-5" />
                Keluar
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
