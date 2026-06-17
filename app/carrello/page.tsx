"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  CarrelloItem,
  getCarrello,
  removeFromCarrello,
  clearCarrello,
} from "@/lib/carrello";
import api from "@/lib/axios";
import { isAxiosError } from "axios";

const tipologiaLabel: Record<string, string> = {
  CITY: "City Bike",
  MOUNTAIN: "Mountain Bike",
  GRAVEL: "Gravel",
  ROAD: "Road Bike",
};

function ModalePagamento({
  totale,
  onConferma,
  onAnnulla,
}: {
  totale: number;
  onConferma: () => void;
  onAnnulla: () => void;
}) {
  const [numero, setNumero] = useState("");
  const [scadenza, setScadenza] = useState("");
  const [cvv, setCvv] = useState("");
  const [elaborando, setElaborando] = useState(false);
  const [errore, setErrore] = useState("");

  const formatNumero = (v: string) =>
    v
      .replace(/\D/g, "")
      .slice(0, 16)
      .replace(/(.{4})/g, "$1 ")
      .trim();

  const formatScadenza = (v: string) => {
    const clean = v.replace(/\D/g, "").slice(0, 4);
    return clean.length >= 3 ? `${clean.slice(0, 2)}/${clean.slice(2)}` : clean;
  };

  async function handlePaga() {
    const cleanNumero = numero.replace(/\s/g, "");
    if (cleanNumero.length !== 16) return setErrore("Numero carta non valido.");
    if (scadenza.length !== 5) return setErrore("Scadenza non valida.");
    if (cvv.length < 3) return setErrore("CVV non valido.");

    setErrore("");
    setElaborando(true);
    await new Promise((r) => setTimeout(r, 1500));
    setElaborando(false);
    onConferma();
  }

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div className="app-surface w-full max-w-sm p-6 flex flex-col gap-4">
        <h2 className="text-lg font-semibold">PAGAMENTO</h2>
        <p className="app-text-muted text-sm">
          Totale da pagare:{" "}
          <strong className="app-text-accent">€{totale.toFixed(2)}</strong>
        </p>

        <div className="flex flex-col gap-3">
          <div>
            <label className="text-xs app-text-muted mb-1 block">
              Numero carta
            </label>
            <input
              className="app-input w-full"
              placeholder="1234 5678 9012 3456"
              value={numero}
              onChange={(e) => setNumero(formatNumero(e.target.value))}
              maxLength={19}
            />
          </div>
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="text-xs app-text-muted mb-1 block">
                Scadenza
              </label>
              <input
                className="app-input w-full"
                placeholder="MM/AA"
                value={scadenza}
                onChange={(e) => setScadenza(formatScadenza(e.target.value))}
                maxLength={5}
              />
            </div>
            <div className="w-24">
              <label className="text-xs app-text-muted mb-1 block">CVV</label>
              <input
                className="app-input w-full"
                placeholder="123"
                value={cvv}
                onChange={(e) =>
                  setCvv(e.target.value.replace(/\D/g, "").slice(0, 4))
                }
                maxLength={4}
              />
            </div>
          </div>
        </div>

        {errore && <p className="text-error text-xs">{errore}</p>}

        <div className="flex gap-3 mt-2">
          <button
            onClick={onAnnulla}
            className="app-btn-ghost flex-1"
            disabled={elaborando}
          >
            Annulla
          </button>
          <button
            onClick={handlePaga}
            className="app-btn-primary flex-1"
            disabled={elaborando}
          >
            {elaborando ? "Elaborazione..." : `Paga €${totale.toFixed(2)}`}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function CarrelloPage() {
  const router = useRouter();
  const [items, setItems] = useState<CarrelloItem[]>(() => getCarrello());
  const [submitting, setSubmitting] = useState(false);
  const [erroriIdx, setErroriIdx] = useState<number[]>([]);
  const [modalePagamento, setModalePagamento] = useState(false);
  const [successo, setSuccesso] = useState(false);

  function handleRimuovi(id: string) {
    removeFromCarrello(id);
    setItems(getCarrello());
  }

  const totaleCarrello = items.reduce((sum, i) => sum + i.totaleParziale, 0);

  async function handleConferma() {
    if (items.length === 0) return;
    setSubmitting(true);
    setErroriIdx([]);
    setModalePagamento(false);

    try {
      await api.post("/prenotazione/batch", {
        prenotazioni: items.map((item) => ({
          biciclettaSpecificId: item.biciclettaSpecificId,
          locationId: item.locationId,
          alimentazione: item.alimentazione,
          dataRitiro: item.dataRitiro,
          oraRitiro: item.oraRitiro,
          dataConsegna: item.dataConsegna,
          oraConsegna: item.oraConsegna,
          coperturaId: item.coperturaId,
          accessoriIds: item.accessoriIds,
          totalePagato: item.totaleParziale,
        })),
      });

      clearCarrello();
      setItems([]);
      setSuccesso(true);
      setTimeout(() => router.push("/"), 2500);
    } catch (err) {
      if (isAxiosError(err) && err.response?.status === 409) {
        const idx =
          (err.response.data as { nonDisponibili: number[] })?.nonDisponibili ??
          [];
        setErroriIdx(idx);
      }
    } finally {
      setSubmitting(false);
    }
  }

  if (successo) {
  return (
    <div className="app-shell flex items-center justify-center">
      <div className="text-center flex flex-col items-center gap-4">
        <div className="text-5xl">✅</div>
        <h2 className="app-title text-xl">Pagamento avvenuto con successo!</h2>
        <p className="app-text-muted text-sm">Ti abbiamo inviato una email di conferma. Verrai reindirizzato a breve...</p>
      </div>
    </div>
  );
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
      {modalePagamento && (
        <ModalePagamento
          totale={totaleCarrello}
          onConferma={handleConferma}
          onAnnulla={() => setModalePagamento(false)}
        />
      )}

      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="app-title text-2xl">Il tuo carrello</h1>
          <span className="app-text-muted text-sm">
            {items.length} articol{items.length === 1 ? "o" : "i"}
          </span>
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
                    ⚠️ Non più disponibile per le date selezionate. Rimuovi dal
                    carrello.
                  </div>
                )}
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <p className="font-bold">{item.prodottoNome}</p>
                    <p className="text-xs app-text-muted">
                      {tipologiaLabel[item.prodottoTipologia] ??
                        item.prodottoTipologia}{" "}
                      · Taglia {item.size} ·{" "}
                      {item.alimentazione === "MUSCOLARE"
                        ? "🚲 Muscolare"
                        : "⚡ Elettrica"}
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
                  <p>
                    📍 {item.locationNome} — {item.locationIndirizzo}
                  </p>
                  <p>
                    📅 {item.dataRitiro} {item.oraRitiro} → {item.dataConsegna}{" "}
                    {item.oraConsegna}
                  </p>
                  <p>
                    🛡 {item.copertura.tipo}
                    {item.copertura.prezzo > 0
                      ? ` (+€${item.copertura.prezzo.toFixed(2)})`
                      : " (gratuita)"}
                  </p>
                  {item.accessori.length > 0 && (
                    <p>🎒 {item.accessori.map((a) => a.nome).join(", ")}</p>
                  )}
                </div>
                <div className="flex justify-between items-center border-t-2 border-base-300 pt-3">
                  <span className="app-text-muted text-sm">Subtotale</span>
                  <span className="font-bold app-text-accent">
                    €{item.totaleParziale.toFixed(2)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        <div className="app-surface p-5 mb-6">
          <div className="flex justify-between items-center">
            <span className="app-text-muted">Totale complessivo</span>
            <span className="text-2xl font-extrabold app-text-accent">
              €{totaleCarrello.toFixed(2)}
            </span>
          </div>
        </div>

        {erroriIdx.length > 0 && (
          <p className="text-error text-sm mb-4 text-center">
            Rimuovi gli articoli non disponibili prima di procedere.
          </p>
        )}

        <div className="flex gap-3">
          <button
            onClick={() => router.push("/")}
            className="app-btn-ghost flex-1"
          >
            ← Continua a noleggiare
          </button>
          <button
            onClick={() => setModalePagamento(true)}
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
