import { NextRequest, NextResponse } from "next/server";
import { verifyAccessToken } from "@/lib/auth/jwt";

const PUBLIC_PATHS = ["/", "/api/auth/login", "/api/auth/refresh", "/api/auth/register", "/docs"];

// path su cui la navbar non deve apparire
const NAVBAR_HIDDEN_PATHS = ["/login", "/register"];

export async function proxy(req: NextRequest) {

  //prende il nome del path a cui si sta accedendo
  const { pathname } = req.nextUrl;

  // console.log("PUBLIC_PATHS check:", PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(p)))

  // console.log("proxy pathname:", pathname)
  // console.log("access_token:", req.cookies.get("access_token")?.value ? "presente" : "assente")

  // se è loggato e prova ad andare su login/register → redirect dashboard
  if (pathname === "/login" || pathname === "/register") {
    const accessToken = req.cookies.get("access_token")?.value;
    if (accessToken) {
      const payload = await verifyAccessToken(accessToken);
      if (payload) return NextResponse.redirect(new URL("/dashboard", req.url));
    }
    // non loggato → passa ma setta il pathname per la navbar
    const requestHeaders = new Headers(req.headers);
    requestHeaders.set("x-pathname", pathname);
    return NextResponse.next({ request: { headers: requestHeaders } });
  }

  //se il path è tra i pubblici si lascia accedere senza controllare il token
  if (PUBLIC_PATHS.some((p) => p === "/" ? pathname === "/" : pathname === p || pathname.startsWith(p))) {
    const requestHeaders = new Headers(req.headers);
    requestHeaders.set("x-pathname", pathname);
    return NextResponse.next({ request: { headers: requestHeaders } });
  }

  //prende il token dai cookie http only
  const accessToken = req.cookies.get("access_token")?.value;

  //se access token non c'è, reindirizza alla login
  if (!accessToken) {
    return handleUnauthenticated(req);
  }

  //qui verifica se il token è valido, azione backend
  const payload = await verifyAccessToken(accessToken);
  // console.log("payload:", payload)
  //se il token non è valido, prova a rinnovarlo con il refresh token
  if (!payload) {
    const refreshToken = req.cookies.get("refresh_token")?.value;
    if (!refreshToken) return handleUnauthenticated(req);

    const refreshRes = await fetch(new URL("/api/auth/refresh", req.url), {
      method: "POST",
      headers: { cookie: req.headers.get("cookie") ?? "" },
    });

    if (!refreshRes.ok) return handleUnauthenticated(req);

    // estrai il nuovo access token dai cookie della response del refresh
    const setCookies = refreshRes.headers.getSetCookie()
    const newAccessToken = setCookies
      .find(c => c.startsWith("access_token="))
      ?.split(";")[0]
      ?.split("=")[1]

    // gli header devono essere sulla request, non sulla response
    // altrimenti il route handler non li vede
    const requestHeaders = new Headers(req.headers);

    if (newAccessToken) {
      const newPayload = await verifyAccessToken(newAccessToken)
      if (newPayload) {
        // inietta i dati utente nella request per il secondo livello di sicurezza
        requestHeaders.set("x-user-id", String(newPayload.userId))
        requestHeaders.set("x-user-role", newPayload.role)
        requestHeaders.set("x-pathname", pathname)
      }
    }

    const response = NextResponse.next({ request: { headers: requestHeaders } });

    // setta i nuovi cookie nel browser
    setCookies.forEach((cookie) => {
      response.headers.append("Set-Cookie", cookie);
    });

    return response;
  }

  // Il proxy ha già verificato access token JWT una volta sola.
  // Invece di ripetere la verifica in ogni route handler,
  // inietta i dati dell'utente direttamente negli header della request.
  // Questi header viaggiano solo lato server — il frontend non li vede mai.
  // I route handler possono leggerli con req.headers.get("x-user-id") senza
  // dover ri-verificare il token.
  const requestHeaders = new Headers(req.headers);
  requestHeaders.set("x-user-id", String(payload.userId));
  requestHeaders.set("x-user-role", payload.role);
  requestHeaders.set("x-pathname", pathname);

  return NextResponse.next({ request: { headers: requestHeaders } });
}


//funzione utility che comunica con axios, dice anche a che pagina rimandare dopo login 
function handleUnauthenticated(req: NextRequest) {
  if (req.nextUrl.pathname.startsWith("/api")) {
    return NextResponse.json({ error: "Non autorizzato" }, { status: 401 })
  }

  const loginUrl = new URL("/login", req.url);
  loginUrl.searchParams.set("from", req.nextUrl.pathname);
  return NextResponse.redirect(loginUrl);
}

//configurazione del middleware per escludere static, image e favicon
//dice di non controllare il token per questi path, altrimenti si rischia di bloccare anche le risorse statiche e le immagini del sito
export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};

export { NAVBAR_HIDDEN_PATHS };