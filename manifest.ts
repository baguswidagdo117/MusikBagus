import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "BagusMusik - Servis & Reparasi Alat Musik",
    short_name: "BagusMusik",
    description:
      "Booking servis alat musik, cek status perbaikan, dan kelola operasional bengkel musik dalam satu platform.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#f6f1e7",
    theme_color: "#111418",
    lang: "id",
    categories: ["business", "shopping", "utilities"],
    icons: [
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
    shortcuts: [
      {
        name: "Booking Servis",
        short_name: "Booking",
        url: "/booking",
        description: "Ajukan booking servis alat musik",
      },
      {
        name: "Cek Status Servis",
        short_name: "Cek Status",
        url: "/cek-status",
        description: "Pantau status perbaikan alat musik",
      },
    ],
  };
}
