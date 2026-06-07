import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

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