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
      <div className="app-shell flex items-center justify-center">
        <div className="text-center">
          <p className="app-text-muted text-lg mb-4">Il carrello è vuoto.</p>
          <button onClick={() => router.push("/")} className="app-btn-primary">
            Torna al catalogo
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="app-shell p-6">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="app-title text-2xl">Il tuo carrello</h1>
          <span className="app-text-muted text-sm">{items.length} articol{items.length === 1 ? "o" : "i"}</span>
        </div>

        <div className="flex flex-col gap-4 mb-8">
          {items.map((item, idx) => {
            const nonDisp = erroriIdx.includes(idx);
            return (
              <div
                key={item.id}
                className={`app-surface p-5 ${nonDisp ? "border-error" : ""}`}
              >
                {nonDisp && (
                  <div className="mb-3 text-error text-xs font-semibold bg-error/10 px-3 py-2 border-2 border-error">
                    ⚠️ Non più disponibile per le date selezionate. Rimuovi dal carrello.
                  </div>
                )}

                <div className="flex justify-between items-start mb-3">
                  <div>
                    <p className="font-bold">{item.prodottoNome}</p>
                    <p className="text-xs app-text-muted">
                      {tipologiaLabel[item.prodottoTipologia] ?? item.prodottoTipologia} · Taglia {item.size} · {item.alimentazione === "MUSCOLARE" ? "🚲 Muscolare" : "⚡ Elettrica"}
                    </p>
                  </div>
                  <button
                    onClick={() => handleRimuovi(item.id)}
                    className="app-text-muted hover:text-error transition text-sm"
                  >
                    ✕ Rimuovi
                  </button>
                </div>

                <div className="text-xs app-text-muted space-y-0.5 mb-3">
                  <p>📍 {item.locationNome} — {item.locationIndirizzo}</p>
                  <p>📅 {item.dataRitiro} {item.oraRitiro} → {item.dataConsegna} {item.oraConsegna}</p>
                  <p>🛡 {item.copertura.tipo}{item.copertura.prezzo > 0 ? ` (+€${item.copertura.prezzo.toFixed(2)})` : " (gratuita)"}</p>
                  {item.accessori.length > 0 && (
                    <p>🎒 {item.accessori.map(a => a.nome).join(", ")}</p>
                  )}
                </div>

                <div className="flex justify-between items-center border-t-2 border-base-300 pt-3">
                  <span className="app-text-muted text-sm">Subtotale</span>
                  <span className="font-bold app-text-accent">€{item.totaleParziale.toFixed(2)}</span>
                </div>
              </div>
            );
          })}
        </div>

        <div className="app-surface p-5 mb-6">
          <div className="flex justify-between items-center">
            <span className="app-text-muted">Totale complessivo</span>
            <span className="text-2xl font-extrabold app-text-accent">€{totaleCarrello.toFixed(2)}</span>
          </div>
        </div>

        {erroriIdx.length > 0 && (
          <p className="text-error text-sm mb-4 text-center">
            Rimuovi gli articoli non disponibili prima di procedere.
          </p>
        )}

        <div className="flex gap-3">
          <button onClick={() => router.push("/")} className="app-btn-ghost flex-1">
            ← Continua a noleggiare
          </button>
          <button
            onClick={handleConferma}
            disabled={submitting || erroriIdx.length > 0}
            className="app-btn-primary flex-1"
          >
            {submitting ? "Conferma in corso..." : "Conferma tutto ✓"}
          </button>
        </div>
      </div>
    </div>
  );
}