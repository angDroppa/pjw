import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { z } from "zod";
import { requireSession } from "@/lib/auth/session";
import { getDisponibileCount } from "@/lib/disponibilita/disponibilita";

const BatchItemSchema = z.object({
  biciclettaSpecificId: z.number().int().positive(),
  locationId:           z.number().int().positive(),
  alimentazione:        z.enum(["MUSCOLARE", "ELETTRICA"]),
  dataRitiro:           z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  oraRitiro:            z.string().regex(/^\d{2}:\d{2}$/),
  dataConsegna:         z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  oraConsegna:          z.string().regex(/^\d{2}:\d{2}$/),
  coperturaId:          z.number().int().positive(),
  accessoriIds:         z.array(z.number().int().positive()).optional().default([]),
  totalePagato:         z.number().positive(),
});

const BatchSchema = z.object({
  prenotazioni: z.array(BatchItemSchema).min(1),
});

export async function POST(req: NextRequest) {
  const session = await requireSession();
  const body = await req.json();

  const parsed = BatchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { prenotazioni } = parsed.data;

  // Controllo disponibilità per tutte prima di creare qualsiasi cosa
  const nonDisponibili: number[] = [];

  for (let i = 0; i < prenotazioni.length; i++) {
    const p = prenotazioni[i];
    const disponibile = await getDisponibileCount(
      p.biciclettaSpecificId,
      p.locationId,
      p.alimentazione,
      new Date(p.dataRitiro),
      new Date(p.dataConsegna),
    );
    if (disponibile === 0) nonDisponibili.push(i);
  }

  if (nonDisponibili.length > 0) {
    return NextResponse.json(
      {
        error:           "Alcune bici non sono più disponibili.",
        nonDisponibili,  // indici degli item non disponibili
      },
      { status: 409 },
    );
  }

  // Tutto disponibile — crea in transazione
  const create = await prisma.$transaction(
    prenotazioni.map((p) =>
      prisma.prenotazione.create({
        data: {
          dataRitiro:    new Date(p.dataRitiro),
          oraRitiro:     p.oraRitiro,
          dataConsegna:  new Date(p.dataConsegna),
          oraConsegna:   p.oraConsegna,
          alimentazione: p.alimentazione,
          totalePagato:  p.totalePagato,
          stato:         "PENDING",
          utenteId:      session.userId,
          biciclettaId:  p.biciclettaSpecificId,
          locationId:    p.locationId,
          coperturaId:   p.coperturaId,
          prenotazioni: {
            create: p.accessoriIds.map((accessorioId) => ({ accessorioId })),
          },
        },
      })
    )
  );

  return NextResponse.json({ prenotazioni: create }, { status: 201 });
}

