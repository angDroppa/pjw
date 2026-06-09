"use client";

import { useConfiguratorStore } from "@/lib/store/configurator.store";

export default function StepAccessori({ onNext, onPrev }: { onNext: () => void; onPrev: () => void }) {
  const { accessori, loadingAccessori, selectedAccessori, toggleAccessorio } = useConfiguratorStore();

  const totaleAccessori = accessori
    .filter(a => selectedAccessori.includes(a.id))
    .reduce((sum, a) => sum + a.prezzo, 0);

  if (loadingAccessori) {
    return (
      <div className="flex items-center justify-center py-12 gap-2 app-text-muted text-sm">
        <span className="loading loading-spinner loading-sm text-primary" />
        Caricamento accessori...
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <p className="app-text-muted text-sm">
        Aggiungi accessori al tuo noleggio. Puoi anche saltare questo step.
      </p>

      <div className="flex flex-col gap-2">
        {accessori.map((acc) => {
          const checked = selectedAccessori.includes(acc.id);
          return (
            <label
              key={acc.id}
              className={`app-option-card flex items-center gap-3 cursor-pointer ${checked ? "app-option-card--selected" : ""}`}
            >
              <input
                type="checkbox"
                checked={checked}
                onChange={() => toggleAccessorio(acc.id)}
                className="checkbox checkbox-primary checkbox-sm rounded-none"
              />
              <span className="flex-1 text-sm">{acc.nome}</span>
              <span className="text-sm font-semibold app-text-muted">+€{acc.prezzo.toFixed(2)}</span>
            </label>
          );
        })}
      </div>

      {totaleAccessori > 0 && (
        <div className="flex justify-between text-sm border-t-2 border-base-300 pt-3">
          <span className="app-text-muted">Totale accessori</span>
          <span className="font-bold app-text-accent">+€{totaleAccessori.toFixed(2)}</span>
        </div>
      )}

      <div className="flex gap-3 mt-2">
        <button type="button" onClick={onPrev} className="app-btn-ghost flex-1">
          ← Indietro
        </button>
        <button type="button" onClick={onNext} className="app-btn-primary flex-1">
          Assicurazione →
        </button>
      </div>
    </div>
  );
}
