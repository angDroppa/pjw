import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { BiciclettaResponse } from "@/lib/validators/bicicletta";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const bicicletta = await prisma.bicicletta.findUnique({
    where: { id: parseInt(id) },
    include: {
      specifics: {
        include: {
          bicicletta: true,
        },
      },
    },
  });

  if (!bicicletta) {
    return NextResponse.json(
      { error: "Bicicletta non trovata" },
      { status: 404 }
    );
  }

  const result: BiciclettaResponse = {
    id: bicicletta.id,
    nome: bicicletta.nome,
    tipologia: bicicletta.tipologia,

    specifics: bicicletta.specifics.map((s) => ({
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
  };

  return NextResponse.json(result);
}