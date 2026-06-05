"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/store/auth.store";
import api from "@/lib/axios/index";

interface Prenotazione {
  id: number;
  dataRitiro: string;
  oraRitiro: string;
  dataConsegna: string;
  oraConsegna: string;
  stato: string;
  totalePagato: number;
  bicicletta: { bicicletta: { nome: string; tipologia: string } };
  biciclettaIstanza?: { codice: string } | null;
  location: { nome: string };
}

const statoLabel: Record<string, string> = {
  PENDING: "In attesa",
  PICKED_UP: "In corso",
  RETURNED: "Completata",
  LATE: "In ritardo",
};

export default function DashboardPage() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const [prenotazioni, setPrenotazioni] = useState<Prenotazione[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/prenotazioni")
      .then(r => setPrenotazioni(r.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleCancella = async (id: number) => {
    if (!confirm("Cancellare questa prenotazione?")) return;
    try {
      await api.delete(`/prenotazioni/${id}`);
      setPrenotazioni(p => p.filter(pr => pr.id !== id));
    } catch { }
  };

  const giorniPrimaDelRitiro = (dataRitiro: string) => {
    const diff = new Date(dataRitiro).getTime() - Date.now();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-2">Ciao, {user?.firstName}!</h1>
        <p className="text-slate-400 mb-8">Gestisci le tue prenotazioni.</p>

        {loading ? (
          <p className="text-slate-500">Caricamento...</p>
        ) : prenotazioni.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-5xl mb-4">🚲</p>
            <p className="text-slate-400 mb-4">Nessuna prenotazione trovata.</p>
            <button
              onClick={() => router.push("/")}
              className="bg-emerald-500 text-black font-bold px-6 py-3 rounded-lg"
            >
              Sfoglia il catalogo
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {prenotazioni.map(p => {
              const giorni = giorniPrimaDelRitiro(p.dataRitiro);
              const puoCancellare = p.stato === "PENDING" && giorni >= 2;

              return (
                <div key={p.id} className="bg-slate-900 border border-slate-800 rounded-xl p-5">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-bold text-lg">
                        {p.bicicletta.bicicletta.nome}
                      </h3>
                      <p className="text-sm text-slate-400">{p.location.nome}</p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                      p.stato === "PENDING" ? "bg-yellow-500/20 text-yellow-400" :
                      p.stato === "PICKED_UP" ? "bg-blue-500/20 text-blue-400" :
                      p.stato === "RETURNED" ? "bg-emerald-500/20 text-emerald-400" :
                      "bg-red-500/20 text-red-400"
                    }`}>
                      {statoLabel[p.stato] ?? p.stato}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-3 mt-4 text-sm">
                    <div>
                      <span className="text-slate-500">Ritiro:</span>
                      <p>{new Date(p.dataRitiro).toLocaleDateString()} {p.oraRitiro}</p>
                    </div>
                    <div>
                      <span className="text-slate-500">Riconsegna:</span>
                      <p>{new Date(p.dataConsegna).toLocaleDateString()} {p.oraConsegna}</p>
                    </div>
                    <div>
                      <span className="text-slate-500">Totale:</span>
                      <p className="font-bold text-emerald-400">€{Number(p.totalePagato).toFixed(2)}</p>
                    </div>
                  </div>
                  {puoCancellare && (
                    <button
                      onClick={() => handleCancella(p.id)}
                      className="mt-3 text-sm text-red-400 hover:text-red-300 transition"
                    >
                      Cancella prenotazione
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
