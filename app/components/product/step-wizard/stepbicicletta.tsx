"use client";

import { useConfiguratorStore } from "@/lib/store/configurator.store";

const TAGLIE = ["S", "M", "L", "XL"];

export default function StepBicicletta({ onNext }: { onNext: () => void }) {
  const {
    selectedSize, setSelectedSize,
    selectedAlimentazione, setSelectedAlimentazione,
  } = useConfiguratorStore();

  const canProceed = !!selectedSize && !!selectedAlimentazione;

  return (
    <div className="flex flex-col gap-6">
      <p className="app-text-muted text-sm">Scegli la taglia e il tipo di propulsione.</p>

      <div>
        <label className="app-label">Taglia</label>
        <div className="flex gap-2">
          {TAGLIE.map((size) => (
            <button
              key={size}
              type="button"
              onClick={() => setSelectedSize(size)}
              className={`app-option ${selectedSize === size ? "app-option--selected" : ""}`}
            >
              {size}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="app-label">Propulsione</label>
        <div className="flex gap-2">
          {(["MUSCOLARE", "ELETTRICA"] as const).map((alim) => (
            <button
              key={alim}
              type="button"
              onClick={() => setSelectedAlimentazione(alim)}
              className={`app-option ${selectedAlimentazione === alim ? "app-option--selected" : ""}`}
            >
              {alim === "MUSCOLARE" ? "🚲 Muscolare" : "⚡ Elettrica"}
            </button>
          ))}
        </div>
      </div>

      <button
        type="button"
        onClick={onNext}
        disabled={!canProceed}
        className="app-btn-primary w-full"
      >
        Scegli le date →
      </button>
    </div>
  );
}
