import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/db";
import { fail, handleError } from "@/lib/api";
import {
  ACCESS_MAX_AGE,
  REFRESH_COOKIE,
  REFRESH_MAX_AGE,
  SESSION_COOKIE,
  signSession,
  verifySession,
  type Role,
} from "@/lib/session";

export async function POST() {
  try {
    const store = await cookies();
    const refresh = await verifySession(store.get(REFRESH_COOKIE)?.value);
    if (!refresh) return fail("Refresh token tidak valid.", 401);

    const dbUser = await prisma.user.findUnique({ where: { id: refresh.id } });
    if (!dbUser || !dbUser.active) return fail("Akun tidak aktif.", 401);

    const user = {
      id: dbUser.id,
      name: dbUser.name,
      email: dbUser.email,
      role: dbUser.role as Role,
    };
    const access = await signSession(user, ACCESS_MAX_AGE);
    const newRefresh = await signSession(user, REFRESH_MAX_AGE);

    const res = NextResponse.json({ success: true, data: { user } });
    res.cookies.set(SESSION_COOKIE, access, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: ACCESS_MAX_AGE,
    });
    res.cookies.set(REFRESH_COOKIE, newRefresh, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: REFRESH_MAX_AGE,
    });
    return res;
  } catch (err) {
    return handleError(err);
  }
}
