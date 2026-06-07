"use client";

import { useConfiguratorStore } from "@/lib/store/configurator.store";

export default function StepAccessori({ onNext, onPrev }: { onNext: () => void; onPrev: () => void }) {
  const { accessori, loadingAccessori, selectedAccessori, toggleAccessorio } = useConfiguratorStore();

  const totaleAccessori = accessori
    .filter(a => selectedAccessori.includes(a.id))
    .reduce((sum, a) => sum + a.prezzo, 0);

  if (loadingAccessori) {
    return (
      <div className="flex items-center justify-center py-12 gap-2 text-slate-400 text-sm">
        <span className="loading loading-spinner loading-sm text-emerald-400" />
        Caricamento accessori...
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <p className="text-slate-400 text-sm">
        Aggiungi accessori al tuo noleggio. Puoi anche saltare questo step.
      </p>

      <div className="flex flex-col gap-2">
        {accessori.map((acc) => {
          const checked = selectedAccessori.includes(acc.id);
          return (
            <label
              key={acc.id}
              className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition ${
                checked
                  ? "border-emerald-400 bg-emerald-400/10"
                  : "border-slate-700 bg-slate-800 hover:border-slate-600"
              }`}
            >
              <input
                type="checkbox"
                checked={checked}
                onChange={() => toggleAccessorio(acc.id)}
                className="w-4 h-4 accent-emerald-400 rounded"
              />
              <span className="flex-1 text-sm text-slate-200">{acc.nome}</span>
              <span className="text-sm font-semibold text-slate-400">+€{acc.prezzo.toFixed(2)}</span>
            </label>
          );
        })}
      </div>

      {totaleAccessori > 0 && (
        <div className="flex justify-between text-sm border-t border-slate-800 pt-3">
          <span className="text-slate-400">Totale accessori</span>
          <span className="font-bold text-emerald-400">+€{totaleAccessori.toFixed(2)}</span>
        </div>
      )}

      <div className="flex gap-3 mt-2">
        <button type="button" onClick={onPrev}
          className="flex-1 py-3 rounded-xl border border-slate-700 text-slate-300 font-semibold text-sm hover:border-slate-500 transition">
          ← Indietro
        </button>
        <button type="button" onClick={onNext}
          className="flex-1 py-3 rounded-xl bg-gradient-to-r from-emerald-400 to-cyan-500 text-slate-900 font-bold text-sm transition hover:opacity-90">
          Assicurazione →
        </button>
      </div>
    </div>
  );
}