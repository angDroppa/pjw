import { SignJWT, jwtVerify } from 'jose'

const accessSecret = new TextEncoder().encode(process.env.JWT_SECRET)
const refreshSecret = new TextEncoder().encode(process.env.JWT_REFRESH_SECRET)

export async function signAccessToken(payload: { id: number; email: string }) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('15m')
    .sign(accessSecret)
}

export async function signRefreshToken(payload: { id: number; email: string }) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(refreshSecret)
}

export async function verifyAccessToken(token: string) {
  const { payload } = await jwtVerify(token, accessSecret)
  return payload as { id: number; email: string }
}

export async function verifyRefreshToken(token: string) {
  const { payload } = await jwtVerify(token, refreshSecret)
  return payload as { id: number; email: string }
}