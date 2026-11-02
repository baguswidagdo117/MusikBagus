"use client";

import { Icon } from "./icons";

export function PrintButton({ label = "Cetak Invoice" }: { label?: string }) {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="btn-dark no-print"
    >
      <Icon name="print" className="h-4 w-4" />
      {label}
    </button>
  );
}
