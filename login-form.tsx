"use client";

import { useState } from "react";
import { Icon } from "./icons";
import { toast } from "./toast";
import { cn } from "@/lib/utils";

const DEMO = [
  { role: "Owner", email: "owner@bagusmusik.id", password: "owner123" },
  { role: "Admin", email: "admin@bagusmusik.id", password: "admin123" },
  { role: "Kasir", email: "kasir@bagusmusik.id", password: "kasir123" },
  { role: "Teknisi", email: "teknisi@bagusmusik.id", password: "teknisi123" },
];

export function LoginForm({ next }: { next?: string }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Login gagal.");
      toast(`Selamat datang, ${json.data.user.name}.`);
      const dest =
        next && next.startsWith("/") ? next : json.data.redirect || "/admin";
      window.location.assign(dest);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login gagal.");
      setLoading(false);
    }
  }

  function fill(account: (typeof DEMO)[number]) {
    setEmail(account.email);
    setPassword(account.password);
    setError("");
  }

  return (
    <form onSubmit={onSubmit} className="mt-6 space-y-4">
      <div>
        <label htmlFor="email" className="label">
          Email
        </label>
        <input
          id="email"
          className="input"
          type="email"
          inputMode="email"
          autoComplete="email"
          placeholder="nama@bagusmusik.id"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
      </div>
      <div>
        <label htmlFor="password" className="label">
          Password
        </label>
        <div className="relative">
          <input
            id="password"
            className="input pr-12"
            type={show ? "text" : "password"}
            autoComplete="current-password"
            placeholder="Masukkan password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <button
            type="button"
            onClick={() => setShow((v) => !v)}
            className="absolute right-1 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-lg text-ink-500 hover:bg-ink-900/5"
            aria-label={show ? "Sembunyikan password" : "Tampilkan password"}
          >
            <Icon name={show ? "x" : "search"} className="h-4 w-4" />
          </button>
        </div>
      </div>

      {error ? (
        <div className="flex gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs font-medium text-rose-700">
          <Icon name="alert" className="mt-0.5 h-4 w-4 shrink-0" />
          {error}
        </div>
      ) : null}

      <button
        type="submit"
        disabled={loading}
        className="btn-primary w-full"
      >
        {loading ? (
          <>
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-ink-950/30 border-t-ink-950" />
            Memeriksa...
          </>
        ) : (
          <>
            <Icon name="login" className="h-4 w-4" />
            Masuk ke Dashboard
          </>
        )}
      </button>

      <div>
        <p className="text-center text-[0.65rem] font-semibold uppercase tracking-wider text-ink-400">
          Isi cepat akun demo
        </p>
        <div className="mt-2 flex flex-wrap justify-center gap-1.5">
          {DEMO.map((account) => (
            <button
              key={account.role}
              type="button"
              onClick={() => fill(account)}
              className={cn(
                "rounded-full border border-ink-900/10 bg-white px-3 py-1 text-xs font-medium text-ink-600 hover:border-brass-400 hover:text-ink-900",
                email === account.email && "border-brass-500 bg-brass-500/10 text-ink-900",
              )}
            >
              {account.role}
            </button>
          ))}
        </div>
      </div>
    </form>
  );
}
