import { AssicurazioneResponse } from "@/lib/validators/assicurazione";

export interface CarrelloItem {
  id: string; // uuid locale
  prodottoId: number;
  prodottoNome: string;
  prodottoTipologia: string;
  biciclettaSpecificId: number;
  size: string;
  prezzoGiornata: number;
  prezzoMezzaGiornata: number;
  locationId: number;
  locationNome: string;
  locationIndirizzo: string;
  alimentazione: "MUSCOLARE" | "ELETTRICA";
  dataRitiro: string;
  oraRitiro: string;
  dataConsegna: string;
  oraConsegna: string;
  accessoriIds: number[];
  accessori: { id: number; nome: string; prezzo: number }[];
  coperturaId: number;
  copertura: AssicurazioneResponse;
  totaleParziale: number;
}

const KEY = "carrello";

function notify() {
  window.dispatchEvent(new Event("carrello-updated"));
}

export function getCarrello(): CarrelloItem[] {
  if (typeof window === "undefined") return [];

  try {
    return JSON.parse(localStorage.getItem(KEY) ?? "[]");
  } catch {
    return [];
  }
}

export function addToCarrello(item: CarrelloItem): void {
  const carrello = getCarrello();
  carrello.push(item);

  localStorage.setItem(KEY, JSON.stringify(carrello));
  notify();
}

export function removeFromCarrello(id: string): void {
  const carrello = getCarrello().filter((i) => i.id !== id);

  localStorage.setItem(KEY, JSON.stringify(carrello));
  notify();
}

export function clearCarrello(): void {
  localStorage.removeItem(KEY);
  notify();
}

export function getCarrelloCount(): number {
  return getCarrello().length;
}