"use client";

import { useConfiguratorStore } from "@/lib/store/configurator.store";

export default function StepAssicurazione({ onNext, onPrev }: { onNext: () => void; onPrev: () => void }) {
  const {
    assicurazioni, loadingAssicurazioni,
    selectedCoperturaId, setSelectedCoperturaId,
  } = useConfiguratorStore();

  if (loadingAssicurazioni) {
    return (
      <div className="flex items-center justify-center py-12 gap-2 app-text-muted text-sm">
        <span className="loading loading-spinner loading-sm text-primary" />
        Caricamento assicurazioni...
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <p className="app-text-muted text-sm">
        Scegli la copertura assicurativa per il tuo noleggio.
      </p>

      <div className="flex flex-col gap-2">
        {assicurazioni.map((ass) => {
          const selected = selectedCoperturaId === ass.id;
          return (
            <button
              key={ass.id}
              type="button"
              onClick={() => setSelectedCoperturaId(ass.id)}
              className={`app-option-card ${selected ? "app-option-card--selected" : ""}`}
            >
              <div className="flex justify-between items-start">
                <span className="font-semibold text-sm">{ass.tipo}</span>
                <span className={`text-sm font-bold ${selected ? "app-text-accent" : "app-text-muted"}`}>
                  {ass.prezzo === 0 ? "Gratuita" : `+€${ass.prezzo.toFixed(2)}`}
                </span>
              </div>
              <p className="text-xs app-text-muted mt-1">{ass.dettagli}</p>
            </button>
          );
        })}
      </div>

      <div className="flex gap-3 mt-2">
        <button type="button" onClick={onPrev} className="app-btn-ghost flex-1">
          ← Indietro
        </button>
        <button
          type="button"
          onClick={onNext}
          disabled={!selectedCoperturaId}
          className="app-btn-primary flex-1"
        >
          Riepilogo →
        </button>
      </div>
    </div>
  );
}
