"use client";

import { useRouter } from "next/navigation";
import type { BiciclettaResponse } from "@/lib/validators/bicicletta";
import { useConfiguratorStore } from "@/lib/store/configurator.store";
import { addToCarrello } from "@/lib/carrello";

function giorniBetween(d1: string, d2: string): number {
  const diff = new Date(d2).getTime() - new Date(d1).getTime();
  return Math.max(1, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between text-sm py-1.5 border-b border-slate-800">
      <span className="text-slate-400">{label}</span>
      <span className="text-white font-medium">{value}</span>
    </div>
  );
}

interface Props {
  product: BiciclettaResponse;
  onPrev: () => void;
  onClose: () => void;
}

export default function StepRiepilogo({ product, onPrev, onClose }: Props) {
  const router = useRouter();
  const {
    dataRitiro, oraRitiro, dataConsegna, oraConsegna,
    selectedSize, selectedAlimentazione, selectedDisponibilita,
    accessori, selectedAccessori,
    assicurazioni, selectedCoperturaId,
    reset,
  } = useConfiguratorStore();

  const specifica    = selectedDisponibilita?.biciclettaSpecific;
  const copertura    = assicurazioni.find(a => a.id === selectedCoperturaId);
  const giorni       = giorniBetween(dataRitiro, dataConsegna);
  const prezzoBase   = specifica ? Number(specifica.prezzoGiornata) * giorni : 0;
  const accSelezionati = accessori.filter(a => selectedAccessori.includes(a.id));
  const prezzoAccessori   = accSelezionati.reduce((sum, a) => sum + a.prezzo, 0);
  const prezzoAssicurazione = copertura ? copertura.prezzo : 0;
  const totale = prezzoBase + prezzoAccessori + prezzoAssicurazione;

  function handleAggiungiAlCarrello() {
    if (!selectedDisponibilita || !specifica || !copertura) return;

    addToCarrello({
      id: crypto.randomUUID(),
      prodottoId:           product.id,
      prodottoNome:         product.nome,
      prodottoTipologia:    product.tipologia,
      biciclettaSpecificId: specifica.id,
      size:                 selectedSize,
      prezzoGiornata:       Number(specifica.prezzoGiornata),
      prezzoMezzaGiornata:  Number(specifica.prezzoMezzaGiornata),
      locationId:           selectedDisponibilita.locationId,
      locationNome:         selectedDisponibilita.location.nome,
      locationIndirizzo:    selectedDisponibilita.location.indirizzo,
      alimentazione:        selectedAlimentazione as "MUSCOLARE" | "ELETTRICA",
      dataRitiro,
      oraRitiro,
      dataConsegna,
      oraConsegna,
      accessoriIds:         selectedAccessori,
      accessori:            accSelezionati,
      coperturaId:          copertura.id,
      copertura,
      totaleParziale:       totale,
    });

    reset();
    onClose();
    router.push("/carrello");
  }

  if (!selectedDisponibilita || !specifica || !copertura) return null;

  return (
    <div className="flex flex-col gap-5">
      <p className="text-slate-400 text-sm">Controlla i dettagli prima di aggiungere al carrello.</p>

      <div className="bg-slate-800/50 rounded-xl p-4 flex flex-col gap-0.5 border border-slate-700/50">
        <Row label="Bicicletta"    value={product.nome} />
        <Row label="Taglia"        value={selectedSize} />
        <Row label="Propulsione"   value={selectedAlimentazione === "MUSCOLARE" ? "🚲 Muscolare" : "⚡ Elettrica"} />
        <Row label="Ritiro"        value={`${dataRitiro} alle ${oraRitiro}`} />
        <Row label="Riconsegna"    value={`${dataConsegna} alle ${oraConsegna}`} />
        <Row label="Durata"        value={`${giorni} giorn${giorni === 1 ? "o" : "i"}`} />
        <Row label="Sede"          value={selectedDisponibilita.location.nome} />
        <Row label="Assicurazione" value={copertura.tipo} />
      </div>

      {accSelezionati.length > 0 && (
        <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Accessori</p>
          {accSelezionati.map(a => (
            <div key={a.id} className="flex justify-between text-sm py-1">
              <span className="text-slate-300">{a.nome}</span>
              <span className="text-slate-400">€{a.prezzo.toFixed(2)}</span>
            </div>
          ))}
        </div>
      )}

      <div className="space-y-1 text-sm text-slate-400 px-1">
        <div className="flex justify-between">
          <span>Bicicletta ({giorni}g)</span>
          <span>€{prezzoBase.toFixed(2)}</span>
        </div>
        {prezzoAccessori > 0 && (
          <div className="flex justify-between">
            <span>Accessori</span>
            <span>€{prezzoAccessori.toFixed(2)}</span>
          </div>
        )}
        <div className="flex justify-between">
          <span>Assicurazione ({copertura.tipo})</span>
          <span>{copertura.prezzo === 0 ? "Gratuita" : `€${copertura.prezzo.toFixed(2)}`}</span>
        </div>
        <div className="flex justify-between font-extrabold text-emerald-400 text-lg pt-2 border-t border-slate-800">
          <span>Totale</span>
          <span>€{totale.toFixed(2)}</span>
        </div>
      </div>

      <div className="flex gap-3">
        <button type="button" onClick={onPrev}
          className="flex-1 py-3 rounded-xl border border-slate-700 text-slate-300 font-semibold text-sm hover:border-slate-500 transition">
          ← Indietro
        </button>
        <button type="button" onClick={handleAggiungiAlCarrello}
          className="flex-1 py-3 rounded-xl bg-gradient-to-r from-emerald-400 to-cyan-500 text-slate-900 font-bold text-sm transition hover:opacity-90 shadow-lg shadow-emerald-500/20">
          🛒 Aggiungi al carrello
        </button>
      </div>
    </div>
  );
}