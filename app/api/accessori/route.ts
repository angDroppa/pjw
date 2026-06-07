import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

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