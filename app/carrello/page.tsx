"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CarrelloItem, getCarrello, removeFromCarrello, clearCarrello } from "@/lib/carrello";
import api from "@/lib/axios";
import { isAxiosError } from "axios";

const tipologiaLabel: Record<string, string> = {
  CITY:     "City Bike",
  MOUNTAIN: "Mountain Bike",
  GRAVEL:   "Gravel",
  ROAD:     "Road Bike",
};

export default function CarrelloPage() {
  const router = useRouter();
  // inizializza direttamente senza useEffect — localStorage è disponibile al mount client
  const [items, setItems]           = useState<CarrelloItem[]>(() => getCarrello());
  const [submitting, setSubmitting] = useState(false);
  const [erroriIdx, setErroriIdx]   = useState<number[]>([]);

  function handleRimuovi(id: string) {
    removeFromCarrello(id);
    setItems(getCarrello());
  }

  const totaleCarrello = items.reduce((sum, i) => sum + i.totaleParziale, 0);

  async function handleConferma() {
    if (items.length === 0) return;
    setSubmitting(true);
    setErroriIdx([]);

    try {
      await api.post("/prenotazione/batch", {
        prenotazioni: items.map((item) => ({
          biciclettaSpecificId: item.biciclettaSpecificId,
          locationId:           item.locationId,
          alimentazione:        item.alimentazione,
          dataRitiro:           item.dataRitiro,
          oraRitiro:            item.oraRitiro,
          dataConsegna:         item.dataConsegna,
          oraConsegna:          item.oraConsegna,
          coperturaId:          item.coperturaId,
          accessoriIds:         item.accessoriIds,
          totalePagato:         item.totaleParziale,
        })),
      });

      clearCarrello();
      router.push("/");
    } catch (err) {
      if (isAxiosError(err) && err.response?.status === 409) {
        const idx = (err.response.data as { nonDisponibili: number[] })?.nonDisponibili ?? [];
        setErroriIdx(idx);
      }
    } finally {
      setSubmitting(false);
    }
  }

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-slate-400 text-lg mb-4">Il carrello è vuoto.</p>
          <button
            onClick={() => router.push("/")}
            className="bg-emerald-500 text-black font-bold px-6 py-3 rounded-xl hover:bg-emerald-400 transition"
          >
            Torna al catalogo
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white p-6">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-extrabold">Il tuo carrello</h1>
          <span className="text-slate-400 text-sm">{items.length} articol{items.length === 1 ? "o" : "i"}</span>
        </div>

        <div className="flex flex-col gap-4 mb-8">
          {items.map((item, idx) => {
            const nonDisp = erroriIdx.includes(idx);
            return (
              <div
                key={item.id}
                className={`bg-slate-900 border rounded-2xl p-5 ${
                  nonDisp ? "border-red-500" : "border-slate-800"
                }`}
              >
                {nonDisp && (
                  <div className="mb-3 text-red-400 text-xs font-semibold bg-red-400/10 rounded-lg px-3 py-2">
                    ⚠️ Non più disponibile per le date selezionate. Rimuovi dal carrello.
                  </div>
                )}

                <div className="flex justify-between items-start mb-3">
                  <div>
                    <p className="font-bold text-white">{item.prodottoNome}</p>
                    <p className="text-xs text-slate-400">
                      {tipologiaLabel[item.prodottoTipologia] ?? item.prodottoTipologia} · Taglia {item.size} · {item.alimentazione === "MUSCOLARE" ? "🚲 Muscolare" : "⚡ Elettrica"}
                    </p>
                  </div>
                  <button
                    onClick={() => handleRimuovi(item.id)}
                    className="text-slate-500 hover:text-red-400 transition text-sm"
                  >
                    ✕ Rimuovi
                  </button>
                </div>

                <div className="text-xs text-slate-400 space-y-0.5 mb-3">
                  <p>📍 {item.locationNome} — {item.locationIndirizzo}</p>
                  <p>📅 {item.dataRitiro} {item.oraRitiro} → {item.dataConsegna} {item.oraConsegna}</p>
                  <p>🛡 {item.copertura.tipo}{item.copertura.prezzo > 0 ? ` (+€${item.copertura.prezzo.toFixed(2)})` : " (gratuita)"}</p>
                  {item.accessori.length > 0 && (
                    <p>🎒 {item.accessori.map(a => a.nome).join(", ")}</p>
                  )}
                </div>

                <div className="flex justify-between items-center border-t border-slate-800 pt-3">
                  <span className="text-slate-400 text-sm">Subtotale</span>
                  <span className="font-bold text-emerald-400">€{item.totaleParziale.toFixed(2)}</span>
                </div>
              </div>
            );
          })}
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 mb-6">
          <div className="flex justify-between items-center">
            <span className="text-slate-400">Totale complessivo</span>
            <span className="text-2xl font-extrabold text-emerald-400">€{totaleCarrello.toFixed(2)}</span>
          </div>
        </div>

        {erroriIdx.length > 0 && (
          <p className="text-red-400 text-sm mb-4 text-center">
            Rimuovi gli articoli non disponibili prima di procedere.
          </p>
        )}

        <div className="flex gap-3">
          <button
            onClick={() => router.push("/")}
            className="flex-1 py-3 rounded-xl border border-slate-700 text-slate-300 font-semibold text-sm hover:border-slate-500 transition"
          >
            ← Continua a noleggiare
          </button>
          <button
            onClick={handleConferma}
            disabled={submitting || erroriIdx.length > 0}
            className="flex-1 py-3 rounded-xl bg-gradient-to-r from-emerald-400 to-cyan-500 text-slate-900 font-bold text-sm transition hover:opacity-90 disabled:opacity-30 disabled:cursor-not-allowed"
          >
            {submitting ? "Conferma in corso..." : "Conferma tutto ✓"}
          </button>
        </div>
      </div>
    </div>
  );
}