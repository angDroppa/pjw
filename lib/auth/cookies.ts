import { cookies } from "next/headers";

//imposta le varibili che vanno nei cookie, con i nomi dei cookie per access e refresh token
const ACCESS_TOKEN_COOKIE = "access_token";
const REFRESH_TOKEN_COOKIE = "refresh_token";

//funzione che setta i cookie di access e refresh token, con le opzioni httpOnly, secure, sameSite, path e maxAge
export async function setAuthCookies(accessToken: string, refreshToken: string) {
  const cookieStore = await cookies();
  const isProd = process.env.NODE_ENV === "production"; // ← qui

  // cookieStore.set(ACCESS_TOKEN_COOKIE, accessToken, {
  //   httpOnly: true,
  //   secure: process.env.NODE_ENV === "production",
  //   sameSite: "lax",
  //   path: "/",
  //   maxAge: 60 * 15, // 15 minuti
  // });

  cookieStore.set(ACCESS_TOKEN_COOKIE, accessToken, {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? "none" : "lax",
    path: "/",
    maxAge: 60 * 15,
  });

  cookieStore.set(REFRESH_TOKEN_COOKIE, refreshToken, {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? "none" : "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
}

//funzione che cancella i cookie di access e refresh token
export async function clearAuthCookies() {
  const cookieStore = await cookies();
  cookieStore.delete(ACCESS_TOKEN_COOKIE);
  cookieStore.delete(REFRESH_TOKEN_COOKIE);
}
// Legge il valore del cookie access_token.
// Usata da session.ts per verificare il token nei Server Component e route handler.
// Il frontend non può accedere a questi cookie — sono HttpOnly.
export async function getAccessToken(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get(ACCESS_TOKEN_COOKIE)?.value ?? null;
}

// Legge il valore del cookie refresh_token.
// Usata da session.ts per verificare il token nei Server Component e route handler.
// Il frontend non può accedere a questi cookie — sono HttpOnly.
export async function getRefreshToken(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get(REFRESH_TOKEN_COOKIE)?.value ?? null;
}