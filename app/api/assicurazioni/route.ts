import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { z } from "zod";

const CreateAssicurazioneSchema = z.object({
  tipo: z.string().min(2),
  dettagli: z.string().min(5),
  prezzo: z.number().positive(),
});

export async function GET() {
  const assicurazioni = await prisma.assicurazione.findMany({
    orderBy: { prezzo: "asc" },
  });

  return NextResponse.json({
    assicurazioni: assicurazioni.map((a) => ({
      id:       a.id,
      tipo:     a.tipo,
      dettagli: a.dettagli,
      prezzo:   a.prezzo.toNumber(),
    })),
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const parsed = CreateAssicurazioneSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const nuovaAssicurazione = await prisma.assicurazione.create({
      data: {
        tipo: parsed.data.tipo,
        dettagli: parsed.data.dettagli,
        prezzo: parsed.data.prezzo,
      },
    });

    return NextResponse.json({
      id: nuovaAssicurazione.id,
      tipo: nuovaAssicurazione.tipo,
      dettagli: nuovaAssicurazione.dettagli,
      prezzo: nuovaAssicurazione.prezzo.toNumber(),
    }, { status: 201 });

  } catch (error) {
    return NextResponse.json(
      { error: "Errore durante la creazione dell'assicurazione" },
      { status: 500 }
    );
  }
}