import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { BiciclettaResponse } from "@/lib/validators/bicicletta";

export async function GET() {
  const biciclette = await prisma.bicicletta.findMany({
    include: {
      specifics: {
        include: {
          bicicletta: true,
        },
      },
    },
  });

  const mapped: BiciclettaResponse[] = biciclette.map((b) => ({
    id: b.id,
    nome: b.nome,
    tipologia: b.tipologia,

    specifics: b.specifics.map((s) => ({
      id: s.id,
      size: s.size,
      prezzoGiornata: s.prezzoGiornata.toNumber(),
      prezzoMezzaGiornata: s.prezzoMezzaGiornata.toNumber(),
      altezzaMin: s.altezzaMin ?? undefined,
      altezzaMax: s.altezzaMax ?? undefined,

      bicicletta: {
        id: s.bicicletta.id,
        nome: s.bicicletta.nome,
        tipologia: s.bicicletta.tipologia,
      },
    })),
  }));

  return NextResponse.json<{ biciclette: BiciclettaResponse[] }>({
    biciclette: mapped,
  });
}