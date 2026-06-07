import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { BiciclettaResponse } from "@/lib/validators/bicicletta";

export async function GET() {
  const biciclette = await prisma.bicicletta.findMany({
    include: { specifics: true },
  });

  const mapped: BiciclettaResponse[] = biciclette.map((b) => ({
    id: b.id,
    nome: b.nome,
    tipologia: b.tipologia,
    specifics: b.specifics.map((s) => ({
      id: s.id,
      size: s.size,
      prezzoGiornata: s.prezzoGiornata.toNumber(),     // Decimal → number
      prezzoMezzaGiornata: s.prezzoMezzaGiornata.toNumber(), // Decimal → number
      altezzaMin: s.altezzaMin ?? undefined,            // null → undefined
      altezzaMax: s.altezzaMax ?? undefined,            // null → undefined
      biciclettaId: s.biciclettaId,
    })),
  }));

  return NextResponse.json<{ biciclette: BiciclettaResponse[] }>({ biciclette: mapped });
}