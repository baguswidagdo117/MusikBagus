import "server-only";
import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { hasPermission, type Permission } from "./permissions";
import { getSession } from "./auth";
import type { SessionUser } from "./session";

export type ApiError = { error: string; details?: unknown };

export function ok<T>(data: T, init?: ResponseInit) {
  return NextResponse.json({ success: true, data }, init);
}

export function fail(
  message: string,
  status = 400,
  details?: unknown,
): NextResponse<ApiError> {
  return NextResponse.json({ error: message, details }, { status });
}

export async function requireApi(permission?: Permission): Promise<
  | { user: SessionUser; error: null }
  | { user: null; error: NextResponse<ApiError> }
> {
  const user = await getSession();
  if (!user) {
    return { user: null, error: fail("Sesi tidak valid. Silakan login.", 401) };
  }
  if (permission && !hasPermission(user.role, permission)) {
    return {
      user: null,
      error: fail("Anda tidak memiliki akses untuk aksi ini.", 403),
    };
  }
  return { user, error: null };
}

export function handleError(err: unknown) {
  if (err instanceof ZodError) {
    return fail("Data tidak valid.", 422, err.flatten());
  }
  console.error("[api]", err);
  if (err instanceof Error && err.message.includes("Unique constraint")) {
    return fail("Data sudah ada (duplikat).", 409);
  }
  return fail("Terjadi kesalahan pada server.", 500);
}

export function getPagination(url: URL) {
  const page = Math.max(1, Number(url.searchParams.get("page") || 1));
  const perPage = Math.min(
    100,
    Math.max(1, Number(url.searchParams.get("perPage") || 20)),
  );
  return { page, perPage, skip: (page - 1) * perPage, take: perPage };
}
