"use client";

import { useRouter } from "next/navigation";
import type { BiciclettaResponse } from "@/lib/validators/bicicletta";
import { useConfiguratorStore } from "@/lib/store/configurator.store";
import { addToCarrello } from "@/lib/carrello";
import { authApi } from "@/lib/axios/auth";

function parseOre(ora: string): number {
  const [h, m] = ora.split(":").map(Number);
  return h + m / 60;
}

function calcolaPrezzo(
  dataRitiro: string,
  oraRitiro: string,
  dataConsegna: string,
  oraConsegna: string,
  prezzoGiornata: number,
  prezzoMezzaGiornata: number,
): { prezzo: number; giorni: number; mezzaGiornata: boolean } {
  const stessoGiorno = dataRitiro === dataConsegna;

  if (stessoGiorno) {
    const diffOre = parseOre(oraConsegna) - parseOre(oraRitiro);
    if (diffOre < 6) {
      return { prezzo: prezzoMezzaGiornata, giorni: 1, mezzaGiornata: true };
    }
  }

  const diff =
    new Date(dataConsegna).getTime() - new Date(dataRitiro).getTime();
  const giorni = Math.max(1, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  return { prezzo: prezzoGiornata * giorni, giorni, mezzaGiornata: false };
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
    dataRitiro,
    oraRitiro,
    dataConsegna,
    oraConsegna,
    selectedSize,
    selectedAlimentazione,
    selectedDisponibilita,
    accessori,
    selectedAccessori,
    assicurazioni,
    selectedCoperturaId,
    reset,
  } = useConfiguratorStore();

  const specifica = selectedDisponibilita?.biciclettaSpecific;
  const copertura = assicurazioni.find((a) => a.id === selectedCoperturaId);

  const {
    prezzo: prezzoBase,
    giorni,
    mezzaGiornata,
  } = specifica
    ? calcolaPrezzo(
        dataRitiro,
        oraRitiro,
        dataConsegna,
        oraConsegna,
        Number(specifica.prezzoGiornata),
        Number(specifica.prezzoMezzaGiornata),
      )
    : { prezzo: 0, giorni: 0, mezzaGiornata: false };

  const accSelezionati = accessori.filter((a) =>
    selectedAccessori.includes(a.id),
  );
  const prezzoAccessori = accSelezionati.reduce((sum, a) => sum + a.prezzo, 0);
  const prezzoAssicurazione = copertura ? Number(copertura.prezzo) : 0;
  const totale = prezzoBase + prezzoAccessori + prezzoAssicurazione;

  async function handleAggiungiAlCarrello() {
    if (!selectedDisponibilita || !specifica || !copertura) return;

    try {
      await authApi.me();
    } catch (e) {
      // in StepRiepilogo, nel catch
      console.log("catch StepRiepilogo", e);
      onClose();
      router.push(
        "/login?toast=Devi+essere+loggato+per+aggiungere+al+carrello",
      );
      return;
    }

    addToCarrello({
      id: crypto.randomUUID(),
      prodottoId: product.id,
      prodottoNome: product.nome,
      prodottoTipologia: product.tipologia,
      biciclettaSpecificId: specifica.id,
      size: selectedSize,
      prezzoGiornata: Number(specifica.prezzoGiornata),
      prezzoMezzaGiornata: Number(specifica.prezzoMezzaGiornata),
      locationId: selectedDisponibilita.locationId,
      locationNome: selectedDisponibilita.location.nome,
      locationIndirizzo: selectedDisponibilita.location.indirizzo,
      alimentazione: selectedAlimentazione as "MUSCOLARE" | "ELETTRICA",
      dataRitiro,
      oraRitiro,
      dataConsegna,
      oraConsegna,
      accessoriIds: selectedAccessori,
      accessori: accSelezionati,
      coperturaId: copertura.id,
      copertura,
      totaleParziale: totale,
    });

    reset();
    onClose();
    router.push("/carrello");
  }

  if (!selectedDisponibilita || !specifica || !copertura) return null;

  return (
    <div className="flex flex-col gap-5">
      <p className="text-slate-400 text-sm">
        Controlla i dettagli prima di aggiungere al carrello.
      </p>

      <div className="bg-slate-800/50 rounded-xl p-4 flex flex-col gap-0.5 border border-slate-700/50">
        <Row label="Bicicletta" value={product.nome} />
        <Row label="Taglia" value={selectedSize} />
        <Row
          label="Propulsione"
          value={
            selectedAlimentazione === "MUSCOLARE"
              ? "🚲 Muscolare"
              : "⚡ Elettrica"
          }
        />
        <Row label="Ritiro" value={`${dataRitiro} alle ${oraRitiro}`} />
        <Row label="Riconsegna" value={`${dataConsegna} alle ${oraConsegna}`} />
        <Row
          label="Durata"
          value={
            mezzaGiornata
              ? "Mezza giornata"
              : `${giorni} giorn${giorni === 1 ? "o" : "i"}`
          }
        />
        <Row label="Sede" value={selectedDisponibilita.location.nome} />
        <Row label="Assicurazione" value={copertura.tipo} />
      </div>

      {accSelezionati.length > 0 && (
        <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
            Accessori
          </p>
          {accSelezionati.map((a) => (
            <div key={a.id} className="flex justify-between text-sm py-1">
              <span className="text-slate-300">{a.nome}</span>
              <span className="text-slate-400">€{a.prezzo.toFixed(2)}</span>
            </div>
          ))}
        </div>
      )}

      <div className="space-y-1 text-sm text-slate-400 px-1">
        <div className="flex justify-between">
          <span>
            {mezzaGiornata
              ? "Bicicletta (mezza giornata)"
              : `Bicicletta (${giorni}g)`}
          </span>
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
          <span>
            {Number(copertura.prezzo) === 0
              ? "Gratuita"
              : `€${Number(copertura.prezzo).toFixed(2)}`}
          </span>
        </div>
        <div className="flex justify-between font-extrabold text-emerald-400 text-lg pt-2 border-t border-slate-800">
          <span>Totale</span>
          <span>€{totale.toFixed(2)}</span>
        </div>
      </div>

      <div className="flex gap-3">
        <button
          type="button"
          onClick={onPrev}
          className="flex-1 py-3 rounded-xl border border-slate-700 text-slate-300 font-semibold text-sm hover:border-slate-500 transition"
        >
          ← Indietro
        </button>
        <button
          type="button"
          onClick={handleAggiungiAlCarrello}
          className="flex-1 py-3 rounded-xl bg-gradient-to-r from-emerald-400 to-cyan-500 text-slate-900 font-bold text-sm transition hover:opacity-90 shadow-lg shadow-emerald-500/20"
        >
          🛒 Aggiungi al carrello
        </button>
      </div>
    </div>
  );
}
