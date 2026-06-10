import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { z } from "zod";

const LocationSchema = z.object({
  nome: z.string().min(2),
  indirizzo: z.string().min(3)
});

export async function GET(req: NextRequest) {
  try {
    const locations = await prisma.location.findMany();
    
    return NextResponse.json(locations, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: "Errore durante il recupero delle sedi" }, 
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    
    const parsed = LocationSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const newLocation = await prisma.location.create({
      data: {
        nome: parsed.data.nome,
        indirizzo: parsed.data.indirizzo
      },
    });

    return NextResponse.json(newLocation, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: "Errore durante la creazione della sede" },
      { status: 500 }
    );
  }
}