import { headers } from "next/headers";
import { getAccessToken } from "./cookies";
import { verifyAccessToken, type AccessTokenPayload } from "./jwt";

// Legge la sessione in due modi:
// 1. Prima controlla gli header iniettati dal proxy (x-user-id, x-user-role)
//    — funziona sia con token valido che dopo il refresh
// 2. Fallback — legge e verifica il token dal cookie direttamente
//    — secondo livello di sicurezza se il proxy viene bypassato
export async function getSession(): Promise<AccessTokenPayload | null> {
  const headersList = await headers()
  const userId = headersList.get("x-user-id")
  const role = headersList.get("x-user-role")

  // se il proxy ha già verificato e iniettato i dati — usali direttamente
  if (userId && role) {
    return { userId: Number(userId), role }
  }

  // fallback — verifica il token dal cookie
  // copre il caso in cui il proxy venga bypassato o non abbia iniettato gli header
  const token = await getAccessToken()
  if (!token) return null
  return verifyAccessToken(token)
}

// Wrapper su getSession che invece di ritornare null lancia un errore.
// Si usa nei route handler dove la sessione è obbligatoria —
// garantisce che il valore ritornato sia sempre un AccessTokenPayload valido.
// Se il proxy viene bypassato o fallisce, questo blocca comunque la request.
export async function requireSession(): Promise<AccessTokenPayload> {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");
  return session;
}