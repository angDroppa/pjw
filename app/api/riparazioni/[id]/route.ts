import prisma from "@/lib/prisma";
import { UpdateRiparazioneSchema, RiparazioneResponseSchema } from "@/lib/validators/riparazione";
import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/auth/session";
import z from "zod";
import { Prisma } from "@/app/generated/prisma/client";
import { inviaEmailRiparazioneCostosa } from "@/lib/email/transport";

type RouteParams = { params: Promise<{ id: string }> };
const idSchema = z.coerce.number().int().positive();

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

export async function PATCH(req: NextRequest, { params }: RouteParams) {
  await requireSession();
  const { id } = await params;
  const parsedId = idSchema.safeParse(id);
  if (!parsedId.success) return NextResponse.json({ error: "Invalid id" }, { status: 400 });

  const body = await req.json();
  const parsed = UpdateRiparazioneSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });

  const current = await prisma.riparazione.findUnique({ where: { id: parsedId.data } });
  if (!current) return NextResponse.json({ error: "Riparazione non trovata" }, { status: 404 });

  const updated = await prisma.riparazione.update({
    where: { id: parsedId.data },
    data: parsed.data,
    include: includeRiparazione,
  });

  const nuovoCosto = updated.costo ? Number(updated.costo) : null;
  if (nuovoCosto !== null && nuovoCosto > 200 && updated.prenotazione?.utente) {
    await inviaEmailRiparazioneCostosa(
      updated.prenotazione.utente.email,
      updated.prenotazione.utente.firstName,
      updated.id,
      nuovoCosto,
    );
  }

  return NextResponse.json(RiparazioneResponseSchema.parse(serializeRiparazione(updated)));
}

export async function PUT(req: NextRequest, { params }: RouteParams) {
  await requireSession();
  const { id } = await params;
  const parsedId = idSchema.safeParse(id);
  if (!parsedId.success) return NextResponse.json({ error: "Invalid id" }, { status: 400 });

  const current = await prisma.riparazione.findUnique({ where: { id: parsedId.data } });
  if (!current) return NextResponse.json({ error: "Riparazione non trovata" }, { status: 404 });
  if (!current.aperta) return NextResponse.json({ error: "Riparazione già chiusa" }, { status: 422 });

  const updated = await prisma.$transaction(async (tx) => {
    const riparazione = await tx.riparazione.update({
      where: { id: parsedId.data },
      data: { aperta: false, dataFine: current.dataFine ?? new Date() },
      include: includeRiparazione,
    });

    const prenotazione = current.prenotazioneId
      ? await tx.prenotazione.findUnique({ where: { id: current.prenotazioneId } })
      : null;
    const campoQuantita =
      prenotazione?.alimentazione === "ELETTRICA" ? "quantitaElettrica" : "quantitaMuscolare";

    await tx.biciclettaLocation.update({
      where: { id: current.biciclettaLocationId },
      data: { [campoQuantita]: { increment: 1 } },
    });

    return riparazione;
  });

  return NextResponse.json(RiparazioneResponseSchema.parse(serializeRiparazione(updated)));
}