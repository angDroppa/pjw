import prisma from "@/lib/prisma";

export async function getDisponibileCount(
  biciclettaSpecificId: number,
  locationId: number,
  alimentazione: "MUSCOLARE" | "ELETTRICA",
  ritiro: Date,
  consegna: Date,
  stock?: { quantitaMuscolare: number; quantitaElettrica: number },
): Promise<number> {
  const s = stock ?? await prisma.biciclettaLocation.findFirst({
    where: { biciclettaSpecificId, locationId },
  });

  if (!s) return 0;

  const accavallate = await prisma.prenotazione.count({
    where: {
      biciclettaId:  biciclettaSpecificId,
      locationId,
      alimentazione,
      stato:         { notIn: ["RETURNED", "LATE"] },
      dataRitiro:    { lt: consegna },
      dataConsegna:  { gt: ritiro },
    },
  });

  const quantitaTotale = alimentazione === "MUSCOLARE"
    ? s.quantitaMuscolare
    : s.quantitaElettrica;

  return Math.max(0, quantitaTotale - accavallate);
}