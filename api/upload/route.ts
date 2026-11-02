import { randomUUID } from "crypto";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { fail, handleError, ok } from "@/lib/api";
import { rateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_SIZE = 5 * 1024 * 1024;

const MIME_EXT: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

function sniff(buffer: Buffer) {
  if (buffer.length < 12) return null;
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff)
    return "jpg";
  if (
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47
  )
    return "png";
  if (
    buffer.toString("ascii", 0, 4) === "RIFF" &&
    buffer.toString("ascii", 8, 12) === "WEBP"
  )
    return "webp";
  return null;
}

export async function POST(req: Request) {
  try {
    const ip = req.headers.get("x-forwarded-for") ?? "local";
    const limit = rateLimit(`upload:${ip}`, 40, 10 * 60_000);
    if (!limit.ok) return fail("Terlalu banyak upload. Coba lagi nanti.", 429);

    const form = await req.formData();
    const file = form.get("file");
    if (!(file instanceof File)) return fail("File tidak ditemukan.", 422);
    if (file.size > MAX_SIZE) return fail("Ukuran foto maksimal 5MB.", 422);
    const ext = MIME_EXT[file.type];
    if (!ext) return fail("Format foto harus JPG, PNG, atau WEBP.", 422);

    const buffer = Buffer.from(await file.arrayBuffer());
    const sniffed = sniff(buffer);
    if (!sniffed || sniffed !== ext) {
      return fail("Isi file tidak sesuai dengan format gambar.", 422);
    }

    const dir = path.join(process.cwd(), ".data", "uploads");
    await mkdir(dir, { recursive: true });
    const filename = `${randomUUID()}.${ext}`;
    await writeFile(path.join(dir, filename), buffer);

    return ok({ url: `/api/uploads/${filename}` });
  } catch (err) {
    return handleError(err);
  }
}
