import { NextRequest, NextResponse } from 'next/server'
import { verifyAccessToken } from '@/lib/jwt'

const protectedRoutes = ['/api/users']
const protectedPages = ['/dashboard']
const authPages = ['/login', '/register']

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl
  const accessToken = req.cookies.get('accessToken')?.value
  const refreshToken = req.cookies.get('refreshToken')?.value

  const isTokenValid = async (token: string) => {
    try { await verifyAccessToken(token); return true } catch { return false }
  }

  // --- root ---
  if (pathname === '/') {
    if (accessToken && await isTokenValid(accessToken)) {
      return NextResponse.redirect(new URL('/dashboard', req.url))
    }
    return NextResponse.next()
  }

  // --- pagine auth: sempre accessibili, redirect solo se già loggato ---
  if (authPages.some(p => pathname.startsWith(p))) {
    if (accessToken && await isTokenValid(accessToken)) {
      return NextResponse.redirect(new URL('/dashboard', req.url))
    }
    return NextResponse.next() // ← esplicito, nessun token = mostra la pagina
  }

  // --- pagine protette ---
  if (protectedPages.some(p => pathname.startsWith(p))) {
    if (!accessToken && !refreshToken) {
      return NextResponse.redirect(new URL('/login', req.url))
    }
    if (accessToken && !await isTokenValid(accessToken) && !refreshToken) {
      const res = NextResponse.redirect(new URL('/login', req.url))
      res.cookies.delete('accessToken')
      return res
    }
    return NextResponse.next()
  }

  // --- API protette ---
  if (protectedRoutes.some(p => pathname.startsWith(p))) {
    const authHeader = req.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Token mancante' }, { status: 401 })
    }
    const token = authHeader.split(' ')[1]
    if (!await isTokenValid(token)) {
      return NextResponse.json({ error: 'Token non valido o scaduto' }, { status: 401 })
    }
    return NextResponse.next()
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/',
    '/api/users/:path*',
    '/dashboard/:path*',
    '/login',
    '/register',
  ],
}