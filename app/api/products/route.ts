import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET() {
  try {
    const products = await prisma.bicicletta.findMany({
      include: {
        // Include il modello per leggere: product.modello?.nome
        modello: true, 
        
        // Include la tipologia per leggere: product.tipologia?.nome
        tipologia: true, 
        
        // Include l'array delle taglie e disponibilità per il ciclo .map()
        dimensione: true, 
      },
      // Opzionale: ordina le biciclette per ID decrescente (le ultime inserite per prime)
      orderBy: {
        id: 'desc',
      },
    })

    return NextResponse.json(products)
  } catch (error) {
    console.error('❌ Errore nel recupero dei prodotti:', error)
    return NextResponse.json(
      { error: 'Errore interno del server' },
      { status: 500 }
    )
  }
}