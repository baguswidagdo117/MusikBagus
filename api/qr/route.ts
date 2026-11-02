import QRCode from "qrcode";
import { fail, handleError, ok, requireApi } from "@/lib/api";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const guard = await requireApi("BOOKING_VIEW");
    if (guard.error) return guard.error;
    const url = new URL(req.url);
    const text = url.searchParams.get("text")?.slice(0, 500);
    const width = Math.min(900, Math.max(160, Number(url.searchParams.get("size") || 320)));
    if (!text) return fail("Parameter text wajib diisi.", 422);
    const dataUrl = await QRCode.toDataURL(text, {
      width,
      margin: 2,
      errorCorrectionLevel: "M",
      color: { dark: "#111418", light: "#ffffff" },
    });
    return ok({ dataUrl, text, width });
  } catch (err) {
    return handleError(err);
  }
}
