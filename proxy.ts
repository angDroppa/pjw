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
  "/api/backoffice": ["admin"],
  "/api/riparazioni": ["admin"],

  "/dashboard/settings": ["admin", "manager"],
};

const NAVBAR_HIDDEN_PATHS = ["/login", "/register", "/verify"];

function getAllowedOrigins(): string[] {
  const origins = [
    "http://localhost:3001",
    "http://localhost:3000",
    "capacitor://localhost",  // iOS
    "http://localhost",       // Android WebView
  ];

  const envOrigin = process.env.CORS_ORIGIN;
  if (envOrigin) {
    envOrigin.split(",").map((o) => o.trim()).forEach((o) => origins.push(o));
  }

  return origins;
}

function setCorsHeaders(req: NextRequest, res: NextResponse) {
  const origin = req.headers.get("origin");
  if (!origin) return;

  const allowedOrigins = getAllowedOrigins();

  const isLocalhost =
    /^http:\/\/localhost(:\d+)?$/.test(origin) ||
    /^http:\/\/127\.0\.0\.1(:\d+)?$/.test(origin) ||
    origin === "capacitor://localhost";

  if (allowedOrigins.includes(origin) || isLocalhost) {
    res.headers.set("Access-Control-Allow-Origin", origin);
    res.headers.set("Access-Control-Allow-Credentials", "true");
    res.headers.set("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS,PATCH");
    res.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization, x-silent-401");
    res.headers.set("Vary", "Origin");
  }
}

function handleForbidden(req: NextRequest) {
  if (req.nextUrl.pathname.startsWith("/api")) {
    return NextResponse.json({ error: "Accesso negato" }, { status: 403 });
  }
  return NextResponse.redirect(new URL("/dashboard", req.url));
}

function handleUnauthenticated(req: NextRequest) {
  if (req.nextUrl.pathname.startsWith("/api")) {
    return NextResponse.json({ error: "Non autorizzato" }, { status: 401 });
  }
  const loginUrl = new URL("/login", req.url);
  loginUrl.searchParams.set("from", req.nextUrl.pathname);
  return NextResponse.redirect(loginUrl);
}

function checkRole(pathname: string, role: string): boolean {
  const matchedPath = Object.keys(ROLE_PROTECTED_PATHS).find((p) =>
    pathname.startsWith(p)
  );
  if (!matchedPath) return true;
  return ROLE_PROTECTED_PATHS[matchedPath].includes(role.toLowerCase());
}

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // =========================
  // CORS preflight
  // =========================
  if (req.method === "OPTIONS") {
    const res = new NextResponse(null, { status: 204 });
    setCorsHeaders(req, res);
    return res;
  }

  // =========================
  // LOGIN / REGISTER bypass auth
  // =========================
  if (pathname === "/login" || pathname === "/register") {
    const accessToken = req.cookies.get("access_token")?.value;

    if (accessToken) {
      const payload = await verifyAccessToken(accessToken);
      if (payload) {
        const res = NextResponse.redirect(new URL("/dashboard", req.url));
        setCorsHeaders(req, res);
        return res;
      }
    }

    const requestHeaders = new Headers(req.headers);
    requestHeaders.set("x-pathname", pathname);

    const res = NextResponse.next({ request: { headers: requestHeaders } });
    setCorsHeaders(req, res);
    return res;
  }

  // =========================
  // PUBLIC PATHS
  // =========================
  if (
    PUBLIC_PATHS.some((p) =>
      p === "/" ? pathname === "/" : pathname === p || pathname.startsWith(p + "/") || pathname === p
    )
  ) {
    const requestHeaders = new Headers(req.headers);
    requestHeaders.set("x-pathname", pathname);

    const res = NextResponse.next({ request: { headers: requestHeaders } });
    setCorsHeaders(req, res);
    return res;
  }

  // =========================
  // AUTH CHECK
  // =========================
  const accessToken = req.cookies.get("access_token")?.value;
  if (!accessToken) return handleUnauthenticated(req);

  const payload = await verifyAccessToken(accessToken);

  // =========================
  // REFRESH FLOW
  // =========================
  if (!payload) {
    const refreshToken = req.cookies.get("refresh_token")?.value;
    if (!refreshToken) return handleUnauthenticated(req);

    const refreshRes = await fetch(new URL("/api/auth/refresh", req.url), {
      method: "POST",
      headers: { cookie: req.headers.get("cookie") ?? "" },
    });

    if (!refreshRes.ok) return handleUnauthenticated(req);

    const setCookies = refreshRes.headers.getSetCookie();

    const newAccessToken = setCookies
      .find((c) => c.startsWith("access_token="))
      ?.split(";")[0]
      ?.split("=")[1];

    const requestHeaders = new Headers(req.headers);

    if (newAccessToken) {
      const newPayload = await verifyAccessToken(newAccessToken);

      if (newPayload) {
        if (!checkRole(pathname, newPayload.role)) {
          const res = handleForbidden(req);
          setCorsHeaders(req, res);
          return res;
        }

        requestHeaders.set("x-user-id", String(newPayload.userId));
        requestHeaders.set("x-user-role", newPayload.role);
        requestHeaders.set("x-pathname", pathname);
      }
    }

    const res = NextResponse.next({ request: { headers: requestHeaders } });
    setCookies.forEach((cookie) => res.headers.append("Set-Cookie", cookie));
    setCorsHeaders(req, res);
    return res;
  }

  // =========================
  // VALID TOKEN
  // =========================
  if (!checkRole(pathname, payload.role)) {
    const res = handleForbidden(req);
    setCorsHeaders(req, res);
    return res;
  }

  const requestHeaders = new Headers(req.headers);
  requestHeaders.set("x-user-id", String(payload.userId));
  requestHeaders.set("x-user-role", payload.role);
  requestHeaders.set("x-pathname", pathname);

  const res = NextResponse.next({ request: { headers: requestHeaders } });
  setCorsHeaders(req, res);
  return res;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};

export { NAVBAR_HIDDEN_PATHS };