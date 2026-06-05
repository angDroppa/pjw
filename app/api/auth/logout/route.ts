import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function POST(req: Request) {
  const body = await req.json()

  if (!body.refreshToken) {
    return NextResponse.json({ error: 'Refresh token mancante' }, { status: 400 })
  }

  try {
    await prisma.refreshToken.delete({
      where: { token: body.refreshToken },
    })
  } catch {
    // Token non trovato: nessun problema
  }

  return NextResponse.json({ message: 'Logout effettuato' })
}
