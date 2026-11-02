import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, verifySession } from "@/lib/session";

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  const session = await verifySession(token);

  if (pathname === "/login") {
    if (session) {
      const dest =
        session.role === "TEKNISI" || session.role === "KASIR"
          ? session.role === "TEKNISI"
            ? "/tech"
            : "/admin"
          : "/admin";
      return NextResponse.redirect(new URL(dest, req.url));
    }
    return NextResponse.next();
  }

  const isAdminArea = pathname.startsWith("/admin");
  const isTechArea = pathname.startsWith("/tech");

  if (!isAdminArea && !isTechArea) return NextResponse.next();

  if (!session) {
    const url = new URL("/login", req.url);
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  if (isAdminArea && session.role === "TEKNISI") {
    return NextResponse.redirect(new URL("/tech", req.url));
  }

  if (isTechArea && session.role === "KASIR") {
    return NextResponse.redirect(new URL("/admin", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/tech/:path*", "/login"],
};
