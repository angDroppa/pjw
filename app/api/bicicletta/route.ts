import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { BiciclettaCatalogSchema } from '@/lib/zodSchemas/bicicletta'

export async function GET() {
  try {
    const biciclette = await prisma.bicicletta.findMany({
      include: {
        specifics: {
          select: {
            id: true,
            size: true,
            alimentazione: true,
            prezzoGiornata: true,
            prezzoMezzaGiornata: true,
            altezzaMin: true,
            altezzaMax: true,
          },
        },
      },
      orderBy: {
        id: 'desc',
      },
    })

    const parsed = BiciclettaCatalogSchema.array().safeParse(biciclette)

    if (!parsed.success) {
      console.error('Zod error:', parsed.error)
      return NextResponse.json(
        { error: 'Invalid data format' },
        { status: 500 }
      )
    }

    return NextResponse.json(parsed.data)
  } catch (error) {
    console.error('GET biciclette error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
