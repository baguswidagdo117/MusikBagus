import { SignJWT, jwtVerify } from "jose";

export type Role = "OWNER" | "ADMIN" | "KASIR" | "TEKNISI";

export type SessionUser = {
  id: string;
  name: string;
  email: string;
  role: Role;
};

export const SESSION_COOKIE = "bm_session";
export const REFRESH_COOKIE = "bm_refresh";
export const ACCESS_MAX_AGE = 60 * 60 * 12; // 12 jam
export const REFRESH_MAX_AGE = 60 * 60 * 24 * 30; // 30 hari

function secretKey() {
  return new TextEncoder().encode(
    process.env.AUTH_SECRET ||
      "bagusmusik-development-secret-change-me-please-0123456789",
  );
}

export async function signSession(
  user: SessionUser,
  maxAge: number = ACCESS_MAX_AGE,
) {
  return new SignJWT({
    sub: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(Math.floor(Date.now() / 1000) + maxAge)
    .sign(secretKey());
}

export async function verifySession(
  token: string | undefined | null,
): Promise<SessionUser | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secretKey());
    if (!payload.sub || !payload.role) return null;
    return {
      id: String(payload.sub),
      name: String(payload.name || ""),
      email: String(payload.email || ""),
      role: payload.role as Role,
    };
  } catch {
    return null;
  }
}
