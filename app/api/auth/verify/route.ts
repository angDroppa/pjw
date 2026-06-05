import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const token = searchParams.get('token')

  if (!token) {
    return NextResponse.json({ error: 'Token mancante' }, { status: 400 })
  }

  const user = await prisma.user.findFirst({
    where: { verificationToken: token },
  })

  if (!user) {
    return NextResponse.json({ error: 'Token non valido' }, { status: 404 })
  }

  await prisma.user.update({
    where: { id: user.id },
    data: {
      verified: true,
      verificationToken: null,
    },
  })

  return NextResponse.json({ message: 'Account attivato con successo!' })
}
