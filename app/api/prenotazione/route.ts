import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { PrenotazioneInputSchema } from "@/lib/validators/prenotazione";
import { requireSession } from "@/lib/auth/session";
import { getDisponibileCount } from "@/lib/disponibilita/disponibilita";

export async function POST(req: NextRequest) {
  const session = await requireSession();

  const body = await req.json();
  const result = PrenotazioneInputSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json({ error: result.error.flatten() }, { status: 400 });
  }

  const { accessoriIds = [], dataRitiro, dataConsegna, ...rest } = result.data;

  const ritiro = new Date(dataRitiro);
  const consegna = new Date(dataConsegna);

  // Controllo disponibilità server-side
  const disponibile = await getDisponibileCount(
    rest.biciclettaId,
    rest.locationId,
    rest.alimentazione,
    ritiro,
    consegna,
  );

  if (disponibile === 0) {
    return NextResponse.json(
      { error: "Nessuna disponibilità per la combinazione richiesta." },
      { status: 409 },
    );
  }

  const prenotazione = await prisma.prenotazione.create({
    data: {
      ...rest,
      utenteId: session.userId,
      dataRitiro: ritiro,
      dataConsegna: consegna,
      prenotazioni: {
        create: accessoriIds.map((accessorioId) => ({ accessorioId })),
      },
    },
  });
  //simula notifica
  await prisma.notifica.create({
    data: {
      utenteId: session.userId,
      tipo: "conferma_prenotazione",
      messaggio: `Prenotazione #${prenotazione.id} confermata`,
    },
  });

  return NextResponse.json({ prenotazione }, { status: 201 });
}

export async function GET(req: NextRequest) {
  const session = await requireSession()

  const prenotazioni = await prisma.prenotazione.findMany({
    where: { utenteId: session.userId },
    include: {
      utente: { select: { id: true, firstName: true, lastName: true, email: true, roleName: true } },
      bicicletta: true,
      location: true,
      copertura: true,
      prenotazioni: { include: { accessorio: true } },
    },
    orderBy: { dataRitiro: 'asc' },
  })

  const mapped = prenotazioni.map(p => ({
    ...p,
    accessori: p.prenotazioni.map(ap => ap.accessorio),
    prenotazioni: undefined,
  }))

  return NextResponse.json(mapped)
}