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
        <div className="flex items-center gap-2 app-text-muted text-sm py-8 justify-center">
          <span className="loading loading-spinner loading-sm text-primary" />
          Controllo disponibilità...
        </div>
      )}

      {!loadingDisp && (
        <div>
          <label className="app-label">Sede di ritiro</label>
          <p className="app-text-muted text-xs mb-3">
            {selectedSize} · {selectedAlimentazione === "MUSCOLARE" ? "🚲 Muscolare" : "⚡ Elettrica"} · {dataRitiro} → {dataConsegna}
          </p>
          {locationDisponibili.length === 0 ? (
            <p className="text-error text-sm">
              Nessuna sede disponibile per questa combinazione.
            </p>
          ) : (
            <div className="flex flex-col gap-2">
              {locationDisponibili.map((disp) => {
                const selected =
                  selectedDisponibilita?.locationId === disp.locationId &&
                  selectedDisponibilita?.biciclettaSpecificId === disp.biciclettaSpecificId;
                return (
                  <button
                    key={`${disp.locationId}-${disp.biciclettaSpecificId}`}
                    type="button"
                    onClick={() => setSelectedDisponibilita(disp)}
                    className={`app-option-card ${selected ? "app-option-card--selected" : ""}`}
                  >
                    <span className="font-semibold text-sm">{disp.location.nome}</span>
                    <span className="block text-xs app-text-muted mt-0.5">{disp.location.indirizzo}</span>
                    <span className="inline-block mt-1.5 text-xs app-text-accent font-semibold">
                      {disp.disponibile} disponibil{disp.disponibile === 1 ? "e" : "i"}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}

      <div className="flex gap-3 mt-2">
        <button type="button" onClick={onPrev} className="app-btn-ghost flex-1">
          ← Indietro
        </button>
        <button
          type="button"
          onClick={onNext}
          disabled={!selectedDisponibilita}
          className="app-btn-primary flex-1"
        >
          Accessori →
        </button>
      </div>
    </div>
  );
}
