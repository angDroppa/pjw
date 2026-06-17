import prisma from "@/lib/prisma";
import { RiparazioneResponseSchema } from "@/lib/validators/riparazione";
import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/auth/session";
import { Prisma } from "@/app/generated/prisma/client";

const includeRiparazione = {
  biciclettaLocation: {
    include: {
      biciclettaSpecific: { include: { bicicletta: true } },
      location: true,
    },
  },
  prenotazione: {
    include: {
      utente: true,
      bicicletta: { include: { bicicletta: true } },
      location: true,
      copertura: true,
      prenotazioni: { include: { accessorio: true } },
    },
  },
} satisfies Prisma.RiparazioneInclude;

type RiparazioneConRelazioni = Prisma.RiparazioneGetPayload<{
  include: typeof includeRiparazione;
}>;

function serializeRiparazione(r: RiparazioneConRelazioni) {
  return {
    ...r,
    dataInizio: r.dataInizio.toISOString(),
    dataFine: r.dataFine ? r.dataFine.toISOString() : null,
    costo: r.costo != null ? Number(r.costo) : null,
    biciclettaLocation: {
      ...r.biciclettaLocation,
      biciclettaSpecific: {
        ...r.biciclettaLocation.biciclettaSpecific,
        prezzoGiornata: Number(r.biciclettaLocation.biciclettaSpecific.prezzoGiornata),
        prezzoMezzaGiornata: Number(r.biciclettaLocation.biciclettaSpecific.prezzoMezzaGiornata),
      },
    },
    prenotazione: r.prenotazione ? {
      ...r.prenotazione,
      dataCreazione: r.prenotazione.dataCreazione.toISOString(),
      dataRitiro: r.prenotazione.dataRitiro.toISOString().slice(0, 10),
      dataConsegna: r.prenotazione.dataConsegna.toISOString().slice(0, 10),
      note: r.prenotazione.note ?? undefined,
      noteRiconsegna: r.prenotazione.noteRiconsegna ?? undefined,
      danni: r.prenotazione.danni ?? undefined,
      totalePagato: Number(r.prenotazione.totalePagato),
      bicicletta: {
        ...r.prenotazione.bicicletta,
        prezzoGiornata: Number(r.prenotazione.bicicletta.prezzoGiornata),
        prezzoMezzaGiornata: Number(r.prenotazione.bicicletta.prezzoMezzaGiornata),
      },
      copertura: {
        ...r.prenotazione.copertura,
        prezzo: Number(r.prenotazione.copertura.prezzo),
      },
      accessori: r.prenotazione.prenotazioni.map((ap) => ({
        id: ap.accessorio.id,
        nome: ap.accessorio.nome,
        prezzo: Number(ap.accessorio.prezzo),
      })),
    } : null,
  };
}

export async function GET(req: NextRequest) {
  await requireSession();

  const riparazioni = await prisma.riparazione.findMany({
    orderBy: { dataInizio: "desc" },
    include: includeRiparazione,
  });

  return NextResponse.json({
    riparazioni: riparazioni.map((r) =>
      RiparazioneResponseSchema.parse(serializeRiparazione(r))
    ),
  });
}