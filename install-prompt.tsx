"use client";

import { useEffect, useState } from "react";
import { Icon } from "./icons";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice?: Promise<{ outcome: "accepted" | "dismissed" }>;
};

export function InstallPrompt() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);
  const [isIos, setIsIos] = useState(false);
  const [showHelp, setShowHelp] = useState(false);

  useEffect(() => {
    if (window.matchMedia("(display-mode: standalone)").matches) return;
    if (localStorage.getItem("bm-install-dismissed") === "1") return;

    const ua = window.navigator.userAgent.toLowerCase();
    const ios = /iphone|ipad|ipod/.test(ua);
    setIsIos(ios);

    const onPrompt = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
      setVisible(true);
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    if (ios) {
      const timer = window.setTimeout(() => setVisible(true), 1800);
      return () => {
        window.clearTimeout(timer);
        window.removeEventListener("beforeinstallprompt", onPrompt);
      };
    }
    return () => window.removeEventListener("beforeinstallprompt", onPrompt);
  }, []);

  if (!visible) return null;

  const dismiss = () => {
    localStorage.setItem("bm-install-dismissed", "1");
    setVisible(false);
    setShowHelp(false);
  };

  const install = async () => {
    if (deferred) {
      await deferred.prompt();
      const choice = await deferred.userChoice;
      if (choice?.outcome === "accepted") setVisible(false);
      return;
    }
    setShowHelp(true);
  };

  return (
    <div className="no-print fixed inset-x-3 bottom-[calc(env(safe-area-inset-bottom)+0.75rem)] z-40 mx-auto max-w-md rounded-2xl border border-ink-900/10 bg-white p-4 shadow-soft sm:left-4 sm:right-auto sm:bottom-4 sm:w-80">
      <div className="flex items-start gap-3">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-ink-900 text-brass-300">
          <Icon name="download" className="h-5 w-5" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-ink-900">Pasang BagusMusik</p>
          <p className="mt-0.5 text-xs leading-relaxed text-ink-600">
            Akses booking dan cek status lebih cepat dari layar utama.
          </p>
          {showHelp && isIos ? (
            <p className="mt-2 rounded-lg bg-ink-900/5 p-2 text-xs text-ink-700">
              Di Safari, ketuk ikon Bagikan lalu pilih &quot;Tambah ke Layar
              Utama&quot;.
            </p>
          ) : null}
          <div className="mt-3 flex gap-2">
            <button onClick={install} className="btn-primary btn-sm">
              {isIos && !deferred ? "Cara pasang" : "Pasang"}
            </button>
            <button onClick={dismiss} className="btn-ghost btn-sm">
              Nanti
            </button>
          </div>
        </div>
        <button
          onClick={dismiss}
          className="grid h-8 w-8 place-items-center rounded-lg text-ink-600 hover:bg-ink-900/5"
          aria-label="Tutup"
        >
          <Icon name="x" className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
