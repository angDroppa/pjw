// app/api/biciclette/[id]/locations/route.ts

import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { BiciclettaLocationSchema } from '@/lib/zodSchemas/biciclettaLocation'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const biciclettaId = parseInt(id)

  const locations = await prisma.biciclettaLocation.findMany({
    where: { biciclettaSpecific: { biciclettaId } },
    include: {
      location: true,
      biciclettaSpecific: true,
    },
  })

  const parsed = BiciclettaLocationSchema.array().safeParse(locations)

  if (!parsed.success) {
    console.error('Zod error:', parsed.error)
    return NextResponse.json({ error: 'Errore validazione dati' }, { status: 500 })
  }

  return NextResponse.json(parsed.data)
}