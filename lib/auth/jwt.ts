import { SignJWT, jwtVerify } from "jose";

//si prendono i segreti dalla env 
const accessSecret = new TextEncoder().encode(process.env.JWT_SECRET!);
const refreshSecret = new TextEncoder().encode(process.env.JWT_REFRESH_SECRET!);

//tipo di payload che mettiamo dentro l'access token, con userId e role
export type AccessTokenPayload = {
  userId: number;
  role: string;
};

//creazione effettiva di access token 
//il payload è di tipo AccessTokenPayload, che contiene userId e role
//gli header si criptano con alg "HS256" e il segreto accessSecret
//il resto è self explanatory
export async function signAccessToken(payload: AccessTokenPayload) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("2s")
    .sign(accessSecret);
}

//funziona di verifica dell'access token, restituisce il payload se il token è valido, altrimenti null
export async function verifyAccessToken(token: string): Promise<AccessTokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, accessSecret);
    return payload as unknown as AccessTokenPayload;
  } catch {
    return null;
  }
}


//creazione effettiva di refresh token 
//il payload è solo number per id utente
//gli header si criptano con alg "HS256" e il segreto refreshSecret
//il resto è self explanatory
export async function signRefreshToken(userId: number) {
  return new SignJWT({ userId })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("1m")
    .sign(refreshSecret);
}

//funzione di verifica del refresh token, restituisce il payload se il token è valido, altrimenti null
export async function verifyRefreshToken(token: string): Promise<{ userId: number } | null> {
  try {
    const { payload } = await jwtVerify(token, refreshSecret);
    return payload as unknown as { userId: number };
  } catch {
    return null;
  }
}