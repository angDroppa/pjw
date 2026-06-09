import { NextRequest, NextResponse } from "next/server";
import { verifyAccessToken } from "@/lib/auth/jwt";

const PUBLIC_PATHS = [
  "/",
  "/api/auth/login",
  "/api/auth/refresh",
  "/api/auth/register",
  "/api/openapi",
  "/docs",
  "/api/bicicletta",
  "/api/accessori",
  "/api/assicurazioni",
  "/api/disponibilita",
  "/details",
  "/api/auth/verify",
  "/verify",
];

const ROLE_PROTECTED_PATHS: Record<string, string[]> = {
  "/backoffice": ["admin"],
  "/dashboard/settings": ["admin", "manager"],
};

const NAVBAR_HIDDEN_PATHS = [
  "/login",
  "/register",
  "/verify",
];

function checkRole(pathname: string, role: string): boolean {
  const matchedPath = Object.keys(ROLE_PROTECTED_PATHS).find(p => pathname.startsWith(p))
  if (!matchedPath) return true
  return ROLE_PROTECTED_PATHS[matchedPath].includes(role.toLowerCase())
}

function handleForbidden(req: NextRequest) {
  if (req.nextUrl.pathname.startsWith('/api')) {
    return NextResponse.json({ error: 'Accesso negato' }, { status: 403 })
  }
  return NextResponse.redirect(new URL('/dashboard', req.url))
}

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (pathname === "/login" || pathname === "/register") {
    const accessToken = req.cookies.get("access_token")?.value;
    if (accessToken) {
      const payload = await verifyAccessToken(accessToken);
      if (payload) return NextResponse.redirect(new URL("/dashboard", req.url));
    }
    const requestHeaders = new Headers(req.headers);
    requestHeaders.set("x-pathname", pathname);
    return NextResponse.next({ request: { headers: requestHeaders } });
  }

  if (PUBLIC_PATHS.some((p) => p === "/" ? pathname === "/" : pathname === p || pathname.startsWith(p))) {
    const requestHeaders = new Headers(req.headers);
    requestHeaders.set("x-pathname", pathname);
    return NextResponse.next({ request: { headers: requestHeaders } });
  }

  const accessToken = req.cookies.get("access_token")?.value;
  if (!accessToken) return handleUnauthenticated(req);

  const payload = await verifyAccessToken(accessToken);

  if (!payload) {
    const refreshToken = req.cookies.get("refresh_token")?.value;
    if (!refreshToken) return handleUnauthenticated(req);

    const refreshRes = await fetch(new URL("/api/auth/refresh", req.url), {
      method: "POST",
      headers: { cookie: req.headers.get("cookie") ?? "" },
    });

    if (!refreshRes.ok) return handleUnauthenticated(req);

    const setCookies = refreshRes.headers.getSetCookie()
    const newAccessToken = setCookies
      .find(c => c.startsWith("access_token="))
      ?.split(";")[0]
      ?.split("=")[1]

    const requestHeaders = new Headers(req.headers);

    if (newAccessToken) {
      const newPayload = await verifyAccessToken(newAccessToken)
      if (newPayload) {
        if (!checkRole(pathname, newPayload.role)) return handleForbidden(req)
        requestHeaders.set("x-user-id", String(newPayload.userId))
        requestHeaders.set("x-user-role", newPayload.role)
        requestHeaders.set("x-pathname", pathname)
      }
    }

    const response = NextResponse.next({ request: { headers: requestHeaders } });
    setCookies.forEach((cookie) => response.headers.append("Set-Cookie", cookie));
    return response;
  }

  if (!checkRole(pathname, payload.role)) return handleForbidden(req)

  const requestHeaders = new Headers(req.headers);
  requestHeaders.set("x-user-id", String(payload.userId));
  requestHeaders.set("x-user-role", payload.role);
  requestHeaders.set("x-pathname", pathname);

  return NextResponse.next({ request: { headers: requestHeaders } });
}

function handleUnauthenticated(req: NextRequest) {
  if (req.nextUrl.pathname.startsWith("/api")) {
    return NextResponse.json({ error: "Non autorizzato" }, { status: 401 })
  }
  const loginUrl = new URL("/login", req.url);
  loginUrl.searchParams.set("from", req.nextUrl.pathname);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};

export { NAVBAR_HIDDEN_PATHS };