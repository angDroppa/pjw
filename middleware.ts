import { NextRequest, NextResponse } from 'next/server'
import { verifyAccessToken } from '@/lib/jwt'

// const ROOT_IS_PRIVATE = true  // ← commenta/decommenta per rendere la root privata o pubblica
const ROOT_IS_PRIVATE = false  // ← commenta/decommenta per rendere la root privata o pubblica


const protectedRoutes = ['/api/users', '/api/backoffice']
const protectedPages = ['/dashboard']
const authPages = ['/login', '/register']

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl
  const accessToken = req.cookies.get('accessToken')?.value
  const refreshToken = req.cookies.get('refreshToken')?.value

  // --- root redirect ---
  if (pathname === '/') {
    if (ROOT_IS_PRIVATE) {
      // Nessuna sessione attiva nemmeno potenzialmente
      if (!accessToken && !refreshToken) {
        return NextResponse.redirect(new URL('/login', req.url))
      }
      if (accessToken) {
        try {
          await verifyAccessToken(accessToken)
          return NextResponse.redirect(new URL('/dashboard', req.url))
        } catch {
          // access scaduto ma c'è il refresh: vai a dashboard, ci penserà l'interceptor
          if (refreshToken) return NextResponse.redirect(new URL('/dashboard', req.url))
          const res = NextResponse.redirect(new URL('/login', req.url))
          res.cookies.delete('accessToken')
          return res
        }
      }
      // solo refreshToken: vai a dashboard, l'interceptor farà il refresh alla prima chiamata
      return NextResponse.redirect(new URL('/dashboard', req.url))
    }
    return NextResponse.next()
  }

  // --- protezione pagine client-side ---
  const isProtectedPage = protectedPages.some(r => pathname.startsWith(r))
  const isAuthPage = authPages.some(r => pathname.startsWith(r))

  if (isProtectedPage) {
    // Nessun token: logout reale
    if (!accessToken && !refreshToken) {
      return NextResponse.redirect(new URL('/login', req.url))
    }

    if (accessToken) {
      try {
        await verifyAccessToken(accessToken)
        // token valido, passa
      } catch {
        // access scaduto: se non c'è il refreshToken redirect a login
        if (!refreshToken) {
          const res = NextResponse.redirect(new URL('/login', req.url))
          res.cookies.delete('accessToken')
          return res
        }
        // refreshToken presente → lascia passare, l'interceptor axios farà il refresh
      }
    }
    // solo refreshToken senza accessToken → lascia passare
  }

  if (isAuthPage && accessToken) {
    try {
      await verifyAccessToken(accessToken)
      return NextResponse.redirect(new URL('/dashboard', req.url))
    } catch {
      // token scaduto, lascia passare alla pagina di login
    }
  }

  // --- protezione API route ---
  const isProtectedApi = protectedRoutes.some(r => pathname.startsWith(r))
  if (!isProtectedApi) return NextResponse.next()

  const authHeader = req.headers.get('authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Token mancante' }, { status: 401 })
  }

  const token = authHeader.split(' ')[1]
  try {
    await verifyAccessToken(token)
    return NextResponse.next()
  } catch {
    return NextResponse.json({ error: 'Token non valido o scaduto' }, { status: 401 })
  }
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