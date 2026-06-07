"use client";

import { useConfiguratorStore } from "@/lib/store/configurator.store";

const fasceOrarie = Array.from({ length: 10 }, (_, i) => {
  const h = i + 9;
  return `${h.toString().padStart(2, "0")}:00`;
});

function validateDates(
  dataRitiro: string, oraRitiro: string,
  dataConsegna: string, oraConsegna: string
): string {
  if (!dataRitiro || !dataConsegna) return "";
  const pickup = new Date(`${dataRitiro}T${oraRitiro}:00`);
  const ret    = new Date(`${dataConsegna}T${oraConsegna}:00`);
  const now    = new Date();
  if (pickup < now) return "La data di ritiro non può essere nel passato";
  if (ret <= pickup) return "La riconsegna deve avvenire dopo il ritiro";
  return "";
}

export default function StepDate({ onNext, onPrev }: { onNext: () => void; onPrev: () => void }) {
  const { dataRitiro, oraRitiro, dataConsegna, oraConsegna, setDate } = useConfiguratorStore();

  const errore = validateDates(dataRitiro, oraRitiro, dataConsegna, oraConsegna);
  const canProceed = dataRitiro && dataConsegna && !errore;

  return (
    <div className="flex flex-col gap-6">
      <p className="text-slate-400 text-sm">Scegli quando vuoi ritirare e riconsegnare la bici.</p>

      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-2">
          <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Ritiro</label>
          <input
            type="date"
            value={dataRitiro}
            onChange={(e) => setDate("dataRitiro", e.target.value)}
            className="bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-emerald-400 transition"
          />
          <select
            value={oraRitiro}
            onChange={(e) => setDate("oraRitiro", e.target.value)}
            className="bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-emerald-400 transition"
          >
            {fasceOrarie.map((h) => <option key={h} value={h}>{h}</option>)}
          </select>
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Riconsegna</label>
          <input
            type="date"
            value={dataConsegna}
            onChange={(e) => setDate("dataConsegna", e.target.value)}
            className="bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-emerald-400 transition"
          />
          <select
            value={oraConsegna}
            onChange={(e) => setDate("oraConsegna", e.target.value)}
            className="bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-emerald-400 transition"
          >
            {fasceOrarie.map((h) => <option key={h} value={h}>{h}</option>)}
          </select>
        </div>
      </div>

      {errore && <p className="text-red-400 text-xs">{errore}</p>}

      <div className="flex gap-3">
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
          disabled={!canProceed}
          className="flex-1 py-3 rounded-xl bg-gradient-to-r from-emerald-400 to-cyan-500 text-slate-900 font-bold text-sm transition hover:opacity-90 disabled:opacity-30 disabled:cursor-not-allowed"
        >
          Verifica disponibilità →
        </button>
      </div>
    </div>
  );
}