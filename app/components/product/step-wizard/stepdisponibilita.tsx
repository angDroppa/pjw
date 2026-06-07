"use client";

import { useEffect, useState } from "react";
import { useConfiguratorStore } from "@/lib/store/configurator.store";
import { getDisponibilita } from "@/lib/axios/disponibilita";
import type { DisponibilitaResponse } from "@/lib/validators/biciclettaLocation";

export default function StepDisponibilita({
  biciclettaId,
  onNext,
  onPrev,
}: {
  biciclettaId: number;
  onNext: () => void;
  onPrev: () => void;
}) {
  const {
    dataRitiro, oraRitiro, dataConsegna, oraConsegna,
    loadingDisp, setLoadingDisp,
    selectedSize, selectedAlimentazione,
    selectedDisponibilita, setSelectedDisponibilita,
  } = useConfiguratorStore();

  const [locationDisponibili, setLocationDisponibili] = useState<DisponibilitaResponse[]>([]);

  useEffect(() => {
    if (!selectedSize || !selectedAlimentazione) return;
    setLoadingDisp(true);
    getDisponibilita({
      dataRitiro, oraRitiro, dataConsegna, oraConsegna,
      biciclettaId,
      size: selectedSize,
      alimentazione: selectedAlimentazione,
    })
      .then(setLocationDisponibili)
      .catch(console.error)
      .finally(() => setLoadingDisp(false));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="flex flex-col gap-6">

      {loadingDisp && (
        <div className="flex items-center gap-2 text-slate-400 text-sm py-8 justify-center">
          <span className="loading loading-spinner loading-sm text-emerald-400" />
          Controllo disponibilità...
        </div>
      )}

      {!loadingDisp && (
        <div>
          <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
            Sede di ritiro
          </label>
          <p className="text-slate-500 text-xs mb-3">
            {selectedSize} · {selectedAlimentazione === "MUSCOLARE" ? "🚲 Muscolare" : "⚡ Elettrica"} · {dataRitiro} → {dataConsegna}
          </p>
          {locationDisponibili.length === 0 ? (
            <p className="text-red-400 text-sm">
              Nessuna sede disponibile per questa combinazione.
            </p>
          ) : (
            <div className="flex flex-col gap-2">
              {locationDisponibili.map((disp) => (
                <button
                  key={`${disp.locationId}-${disp.biciclettaSpecificId}`}
                  type="button"
                  onClick={() => setSelectedDisponibilita(disp)}
                  className={`w-full text-left p-3 rounded-xl border transition ${
                    selectedDisponibilita?.locationId === disp.locationId &&
                    selectedDisponibilita?.biciclettaSpecificId === disp.biciclettaSpecificId
                      ? "border-emerald-400 bg-emerald-400/10 text-white"
                      : "border-slate-700 bg-slate-800 text-slate-300 hover:border-slate-500"
                  }`}
                >
                  <span className="font-semibold text-sm">{disp.location.nome}</span>
                  <span className="block text-xs text-slate-400 mt-0.5">{disp.location.indirizzo}</span>
                  <span className="inline-block mt-1.5 text-xs text-emerald-400 font-semibold">
                    {disp.disponibile} disponibil{disp.disponibile === 1 ? "e" : "i"}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="flex gap-3 mt-2">
        <button
          type="button"
          onClick={onPrev}
          className="flex-1 py-3 rounded-xl border border-slate-700 text-slate-300 font-semibold text-sm hover:border-slate-500 transition"
        >
          ← Indietro
        </button>
        <button
          type="button"
          onClick={onNext}
          disabled={!selectedDisponibilita}
          className="flex-1 py-3 rounded-xl bg-gradient-to-r from-emerald-400 to-cyan-500 text-slate-900 font-bold text-sm transition hover:opacity-90 disabled:opacity-30 disabled:cursor-not-allowed"
        >
          Accessori →
        </button>
      </div>
    </div>
  );
}