"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuthStore } from "@/lib/store/auth.store";
import api from "@/lib/axios";
import { calcolaPrezzoBici } from "@/lib/pricing";

interface PrenotazioneConfig {
  prodotto: { id: number; nome: string; tipologia: string };
  biciclettaSpecificId: number;
  biciclettaSpecific: {
    size: string;
    alimentazione: string;
    prezzoGiornata: number;
    prezzoMezzaGiornata: number;
  };
  locationId: number;
  location: { nome: string; indirizzo: string };
  alimentazione: string;
  accessoriIds: number[];
  accessori: { id: number; nome: string; prezzo?: number }[];
}

interface Assicurazione {
  id: number;
  tipo: string;
  dettagli: string;
  prezzo: number;
}

const tipologiaLabel: Record<string, string> = {
  CITY: "City Bike",
  MOUNTAIN: "Mountain Bike",
  GRAVEL: "Gravel",
  ROAD: "Road Bike",
};

export default function CheckoutPage() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const [config, setConfig] = useState<PrenotazioneConfig | null>(null);
  const [assicurazioni, setAssicurazioni] = useState<Assicurazione[]>([]);
  const [selectedAssicurazione, setSelectedAssicurazione] = useState<number | null>(null);
  const [dataRitiro, setDataRitiro] = useState("");
  const [oraRitiro, setOraRitiro] = useState("10:00");
  const [dataConsegna, setDataConsegna] = useState("");
  const [oraConsegna, setOraConsegna] = useState("10:00");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("prenotazioneConfig");
    if (saved) {
      setConfig(JSON.parse(saved));
    }
    fetch("/api/assicurazioni")
      .then(r => r.json())
      .then(setAssicurazioni)
      .catch(console.error);
  }, []);

  if (!config) {
    return (
      <div className="min-h-screen flex items-center justify-center text-white bg-slate-950">
        <p className="text-slate-400">Nessuna configurazione trovata. Torna al catalogo.</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center text-white bg-slate-950">
        <div className="text-center">
          <p className="text-slate-400 mb-6">Devi accedere per completare la prenotazione.</p>
          <div className="flex gap-4 justify-center">
            <a href="/login" className="bg-emerald-500 text-black font-bold px-6 py-3 rounded-lg hover:bg-emerald-400">Accedi</a>
            <a href="/register" className="bg-slate-700 text-white font-bold px-6 py-3 rounded-lg hover:bg-slate-600">Registrati</a>
          </div>
        </div>
      </div>
    );
  }

  const prezzoAccessori = config.accessori.reduce((sum, a) => sum + Number(a.prezzo ?? 0), 0);
  const assicurazioneScelta = assicurazioni.find(a => a.id === selectedAssicurazione);
  const prezzoAssicurazione = Number(assicurazioneScelta?.prezzo ?? 0);

  const priceCalc = dataRitiro && dataConsegna
    ? calcolaPrezzoBici(
        Number(config.biciclettaSpecific.prezzoGiornata),
        Number(config.biciclettaSpecific.prezzoMezzaGiornata),
        new Date(dataRitiro),
        oraRitiro,
        new Date(dataConsegna),
        oraConsegna
      )
    : { prezzo: 0, label: "" }
  const prezzoBici = priceCalc.prezzo
  const durataLabel = priceCalc.label
  const totale = prezzoBici + prezzoAccessori + prezzoAssicurazione;

  const erroreData = dataRitiro && dataConsegna
    ? (() => {
        const pickup = new Date(`${dataRitiro}T${oraRitiro}:00`)
        const ret = new Date(`${dataConsegna}T${oraConsegna}:00`)
        const now = new Date()
        if (pickup < now) return "La data di ritiro non può essere nel passato"
        if (ret <= pickup) return "La riconsegna deve avvenire dopo il ritiro"
        return ""
      })()
    : ""

  // Genera fasce orarie 9:00-18:00 slot 1h
  const fasceOrarie = Array.from({ length: 10 }, (_, i) => {
    const h = i + 9;
    return `${h.toString().padStart(2, "0")}:00`;
  });

  async function handleConferma() {
    if (!dataRitiro || !dataConsegna) return alert("Compila tutte le date");
    if (!user) return alert("Devi effettuare il login prima di confermare.");
    if (!config) return;

    setSubmitting(true);
    try {
      const res = await api.post("/prenotazioni", {
        dataRitiro: new Date(dataRitiro).toISOString(),
        oraRitiro,
        dataConsegna: new Date(dataConsegna).toISOString(),
        oraConsegna,
        biciclettaId: config.biciclettaSpecificId,
        locationId: config.locationId,
        assicurazioneId: selectedAssicurazione ?? 0,
        accessoriIds: config.accessoriIds,
      });
      localStorage.removeItem("prenotazioneConfig");
      router.push("/dashboard");
    } catch {
      // errore già gestito dall'interceptor axios / toast
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white p-6">
      <div className="max-w-2xl mx-auto bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <h1 className="text-2xl font-bold mb-6">Riepilogo Prenotazione</h1>

        <div className="mb-4">
          <h2 className="text-slate-400 text-sm">Bicicletta</h2>
          <p className="text-white font-semibold">{config.prodotto.nome}</p>
          <p className="text-xs text-slate-500">{tipologiaLabel[config.prodotto.tipologia] ?? config.prodotto.tipologia}</p>
        </div>

        <div className="mb-4">
          <h2 className="text-slate-400 text-sm">Taglia</h2>
          <p>{config.biciclettaSpecific.size}</p>
        </div>

        <div className="mb-4">
          <h2 className="text-slate-400 text-sm">Propulsione</h2>
          <p>{config.alimentazione === "ELETTRICA" ? "⚡ Elettrica" : "🚲 Muscolare"}</p>
        </div>

        <div className="mb-4">
          <h2 className="text-slate-400 text-sm">Punto di ritiro</h2>
          <p className="font-medium">{config.location.nome}</p>
          <p className="text-xs text-slate-500">{config.location.indirizzo}</p>
        </div>

        <div className="mb-4">
          <h2 className="text-slate-400 text-sm">Accessori</h2>
          {config.accessori.length === 0 ? (
            <p className="text-slate-500 text-sm">Nessun accessorio selezionato</p>
          ) : (
            <ul className="list-disc ml-5">
              {config.accessori.map(a => (
                <li key={a.id}>
                  {a.nome}
                  {a.prezzo !== undefined && <span className="text-slate-400"> (€{Number(a.prezzo).toFixed(2)})</span>}
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="mb-4">
          <h2 className="text-slate-400 text-sm mb-2">Assicurazione</h2>
          <div className="flex flex-col gap-2">
            {assicurazioni.map(a => (
              <label
                key={a.id}
                className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition ${
                  selectedAssicurazione === a.id
                    ? "border-emerald-400 bg-emerald-400/10"
                    : "border-slate-700 bg-slate-800 hover:border-slate-500"
                }`}
              >
                <input
                  type="radio"
                  name="assicurazione"
                  checked={selectedAssicurazione === a.id}
                  onChange={() => setSelectedAssicurazione(a.id)}
                  className="accent-emerald-400"
                />
                <div>
                  <span className="font-medium">{a.tipo}</span>
                  <p className="text-xs text-slate-400">{a.dettagli}</p>
                </div>
                <span className="ml-auto font-semibold text-emerald-400">€{Number(a.prezzo).toFixed(2)}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-slate-400 text-sm mb-1">Data ritiro</label>
            <input
              type="date"
              value={dataRitiro}
              onChange={e => setDataRitiro(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white"
            />
          </div>
          <div>
            <label className="block text-slate-400 text-sm mb-1">Ora ritiro</label>
            <select
              value={oraRitiro}
              onChange={e => setOraRitiro(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white"
            >
              {fasceOrarie.map(h => (
                <option key={h} value={h}>{h}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-slate-400 text-sm mb-1">Data riconsegna</label>
            <input
              type="date"
              value={dataConsegna}
              onChange={e => setDataConsegna(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white"
            />
          </div>
          <div>
            <label className="block text-slate-400 text-sm mb-1">Ora riconsegna</label>
            <select
              value={oraConsegna}
              onChange={e => setOraConsegna(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white"
            >
              {fasceOrarie.map(h => (
                <option key={h} value={h}>{h}</option>
              ))}
            </select>
          </div>
        </div>

        {erroreData && (
          <p className="text-red-400 text-sm mb-4">{erroreData}</p>
        )}

        <div className="space-y-1 text-sm text-slate-400">
          <p className="flex justify-between"><span>Bicicletta ({durataLabel})</span><span>€{prezzoBici.toFixed(2)}</span></p>
          {prezzoAccessori > 0 && (
            <p className="flex justify-between"><span>Accessori</span><span>€{prezzoAccessori.toFixed(2)}</span></p>
          )}
          {assicurazioneScelta && (
            <p className="flex justify-between"><span>Assicurazione ({assicurazioneScelta.tipo})</span><span>€{prezzoAssicurazione.toFixed(2)}</span></p>
          )}
        </div>

        <div className="mt-3 p-4 bg-slate-800 rounded-lg">
          <h2 className="text-slate-400 text-sm">Totale</h2>
          <p className="text-2xl font-bold text-emerald-400">€ {totale.toFixed(2)}</p>
        </div>

        <div className="flex gap-3 mt-6">
          <button
            onClick={() => { localStorage.removeItem("prenotazioneConfig"); router.push("/"); }}
            className="w-1/2 bg-slate-700 hover:bg-slate-600 p-3 rounded-lg"
          >
            Indietro
          </button>

          <button
            onClick={handleConferma}
            disabled={!selectedAssicurazione || !dataRitiro || !dataConsegna || submitting || !!erroreData}
            className="w-1/2 bg-emerald-500 text-black font-bold p-3 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Conferma
          </button>
        </div>
      </div>
    </div>
  );
}
