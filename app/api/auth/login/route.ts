import { NextResponse } from "next/server";
import { z } from "zod";
import { verifyCredentials } from "@/lib/auth";
import { fail, handleError } from "@/lib/api";
import { rateLimit } from "@/lib/rate-limit";
import { audit } from "@/lib/audit";
import {
  ACCESS_MAX_AGE,
  REFRESH_COOKIE,
  REFRESH_MAX_AGE,
  SESSION_COOKIE,
  signSession,
} from "@/lib/session";
import { roleHome } from "@/lib/permissions";

const schema = z.object({
  email: z.string().email("Email tidak valid"),
  password: z.string().min(1, "Password wajib diisi"),
});

export async function POST(req: Request) {
  try {
    const ip = req.headers.get("x-forwarded-for") ?? "local";
    const limit = rateLimit(`login:${ip}`, 10, 60_000);
    if (!limit.ok) {
      return fail(
        `Terlalu banyak percobaan. Coba lagi dalam ${limit.retryAfter} detik.`,
        429,
      );
    }

    const body = await req.json();
    const { email, password } = schema.parse(body);
    const user = await verifyCredentials(email, password);
    if (!user) return fail("Email atau password salah.", 401);

    const access = await signSession(user, ACCESS_MAX_AGE);
    const refresh = await signSession(user, REFRESH_MAX_AGE);
    const res = NextResponse.json({
      success: true,
      data: { user, redirect: roleHome(user.role) },
    });
    res.cookies.set(SESSION_COOKIE, access, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: ACCESS_MAX_AGE,
    });
    res.cookies.set(REFRESH_COOKIE, refresh, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: REFRESH_MAX_AGE,
    });
    await audit({
      userId: user.id,
      action: "LOGIN",
      entity: "User",
      entityId: user.id,
      ip,
    });
    return res;
  } catch (err) {
    return handleError(err);
  }
}
