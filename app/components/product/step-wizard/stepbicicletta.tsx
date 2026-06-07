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
      <p className="text-slate-400 text-sm">Scegli la taglia e il tipo di propulsione.</p>

      {/* Taglia */}
      <div>
        <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-3">
          Taglia
        </label>
        <div className="flex gap-2">
          {TAGLIE.map((size) => (
            <button
              key={size}
              type="button"
              onClick={() => setSelectedSize(size)}
              className={`flex-1 py-3 rounded-xl border font-bold text-sm transition ${
                selectedSize === size
                  ? "border-emerald-400 bg-emerald-400/10 text-white"
                  : "border-slate-700 bg-slate-800 text-slate-400 hover:border-slate-500 hover:text-white"
              }`}
            >
              {size}
            </button>
          ))}
        </div>
      </div>

      {/* Alimentazione */}
      <div>
        <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-3">
          Propulsione
        </label>
        <div className="flex gap-2">
          {(["MUSCOLARE", "ELETTRICA"] as const).map((alim) => (
            <button
              key={alim}
              type="button"
              onClick={() => setSelectedAlimentazione(alim)}
              className={`flex-1 py-3 rounded-xl border font-semibold text-sm transition ${
                selectedAlimentazione === alim
                  ? alim === "MUSCOLARE"
                    ? "border-emerald-400 bg-emerald-400/10 text-emerald-400"
                    : "border-cyan-400 bg-cyan-400/10 text-cyan-400"
                  : "border-slate-700 bg-slate-800 text-slate-400 hover:border-slate-500 hover:text-white"
              }`}
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
        className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-400 to-cyan-500 text-slate-900 font-bold text-sm transition hover:opacity-90 disabled:opacity-30 disabled:cursor-not-allowed"
      >
        Scegli le date →
      </button>
    </div>
  );
}