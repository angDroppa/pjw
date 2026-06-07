"use client";

import { useConfiguratorStore } from "@/lib/store/configurator.store";

export default function StepAssicurazione({ onNext, onPrev }: { onNext: () => void; onPrev: () => void }) {
  const {
    assicurazioni, loadingAssicurazioni,
    selectedCoperturaId, setSelectedCoperturaId,
  } = useConfiguratorStore();

  if (loadingAssicurazioni) {
    return (
      <div className="flex items-center justify-center py-12 gap-2 text-slate-400 text-sm">
        <span className="loading loading-spinner loading-sm text-emerald-400" />
        Caricamento assicurazioni...
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <p className="text-slate-400 text-sm">
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
              className={`w-full text-left p-4 rounded-xl border transition ${
                selected
                  ? "border-emerald-400 bg-emerald-400/10"
                  : "border-slate-700 bg-slate-800 hover:border-slate-600"
              }`}
            >
              <div className="flex justify-between items-start">
                <span className="font-semibold text-sm text-white">{ass.tipo}</span>
                <span className={`text-sm font-bold ${selected ? "text-emerald-400" : "text-slate-400"}`}>
                  {ass.prezzo === 0 ? "Gratuita" : `+€${ass.prezzo.toFixed(2)}`}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1">{ass.dettagli}</p>
            </button>
          );
        })}
      </div>

      <div className="flex gap-3 mt-2">
        <button type="button" onClick={onPrev}
          className="flex-1 py-3 rounded-xl border border-slate-700 text-slate-300 font-semibold text-sm hover:border-slate-500 transition">
          ← Indietro
        </button>
        <button type="button" onClick={onNext}
          disabled={!selectedCoperturaId}
          className="flex-1 py-3 rounded-xl bg-gradient-to-r from-emerald-400 to-cyan-500 text-slate-900 font-bold text-sm transition hover:opacity-90 disabled:opacity-30 disabled:cursor-not-allowed">
          Riepilogo →
        </button>
      </div>
    </div>
  );
}