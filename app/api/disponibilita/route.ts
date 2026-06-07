import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { DisponibilitaQuerySchema, DisponibilitaResponse } from "@/lib/validators/biciclettaLocation";
import { getDisponibileCount } from "@/lib/disponibilita/disponibilita";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);

  const parsed = DisponibilitaQuerySchema.safeParse({
    dataRitiro:    searchParams.get("dataRitiro"),
    oraRitiro:     searchParams.get("oraRitiro"),
    dataConsegna:  searchParams.get("dataConsegna"),
    oraConsegna:   searchParams.get("oraConsegna"),
    biciclettaId:  Number(searchParams.get("biciclettaId")),
    size:          searchParams.get("size"),
    alimentazione: searchParams.get("alimentazione"),
  });

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { dataRitiro, dataConsegna, biciclettaId, size, alimentazione } = parsed.data;

  const ritiro   = new Date(dataRitiro);
  const consegna = new Date(dataConsegna);

  const stocks = await prisma.biciclettaLocation.findMany({
    where: {
      biciclettaSpecific: { biciclettaId, size },
    },
    include: {
      location:           true,
      biciclettaSpecific: true,
    },
  });

  const result: DisponibilitaResponse[] = [];

  for (const stock of stocks) {
    const disponibile = await getDisponibileCount(
      stock.biciclettaSpecificId,
      stock.locationId,
      alimentazione,
      ritiro,
      consegna,
      stock, // passa lo stock già caricato, evita query extra
    );

    if (disponibile === 0) continue;

    result.push({
      locationId: stock.locationId,
      location: {
        id:        stock.location.id,
        nome:      stock.location.nome,
        indirizzo: stock.location.indirizzo,
      },
      biciclettaSpecificId: stock.biciclettaSpecificId,
      biciclettaSpecific: {
        id:                  stock.biciclettaSpecific.id,
        size:                stock.biciclettaSpecific.size,
        prezzoGiornata:      stock.biciclettaSpecific.prezzoGiornata.toNumber(),
        prezzoMezzaGiornata: stock.biciclettaSpecific.prezzoMezzaGiornata.toNumber(),
        altezzaMin:          stock.biciclettaSpecific.altezzaMin ?? undefined,
        altezzaMax:          stock.biciclettaSpecific.altezzaMax ?? undefined,
        biciclettaId:        stock.biciclettaSpecific.biciclettaId,
      },
      disponibile,
    });
  }

  return NextResponse.json<{ disponibilita: DisponibilitaResponse[] }>({ disponibilita: result });
}