import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { z } from "zod";

const CreateAccessorioSchema = z.object({
  nome: z.string().min(2),
  prezzo: z.number().positive(),
});

export async function GET() {
  const accessori = await prisma.accessorio.findMany({
    orderBy: { nome: "asc" },
  });

  return NextResponse.json({
    accessori: accessori.map((a) => ({
      id:     a.id,
      nome:   a.nome,
      prezzo: a.prezzo,
    })),
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const parsed = CreateAccessorioSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const nuovoAccessorio = await prisma.accessorio.create({
      data: {
        nome: parsed.data.nome,
        prezzo: parsed.data.prezzo,
      },
    });

    return NextResponse.json(nuovoAccessorio, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: "Errore durante la creazione dell'accessorio" },
      { status: 500 }
    );
  }
}