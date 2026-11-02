import { readFile } from "fs/promises";
import path from "path";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const CONTENT_TYPE: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
};

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ name: string }> },
) {
  const { name } = await params;
  if (!/^[a-f0-9-]+\.(jpg|jpeg|png|webp)$/i.test(name)) {
    return new Response("Not found", { status: 404 });
  }
  const ext = name.split(".").pop()!.toLowerCase();
  try {
    const file = await readFile(path.join(process.cwd(), ".data", "uploads", name));
    return new Response(new Uint8Array(file), {
      headers: {
        "Content-Type": CONTENT_TYPE[ext] || "application/octet-stream",
        "Cache-Control": "public, max-age=31536000, immutable",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return new Response("Not found", { status: 404 });
  }
}
