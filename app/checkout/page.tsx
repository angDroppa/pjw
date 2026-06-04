"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function CheckoutPage() {
  const router = useRouter();

  // MOCK dati (poi li sostituisci con Zustand o context)
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    const mock = {
      bici: "City Bike",
      taglia: "M",
      location: "Sede Centrale - Piazza Duomo",
      accessori: ["Caschetto", "Luci"],
      assicurazione: "Base",
      giorni: 2,
      prezzo: 48,
    };

    setData(mock);
  }, []);

  if (!data) {
    return (
      <div className="min-h-screen flex items-center justify-center text-white bg-slate-950">
        Caricamento riepilogo...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white p-6">
      <div className="max-w-2xl mx-auto bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <h1 className="text-2xl font-bold mb-6">Riepilogo Prenotazione</h1>

        {/* BIKE */}
        <div className="mb-4">
          <h2 className="text-slate-400 text-sm">Bicicletta</h2>
          <p className="text-white font-semibold">{data.bici}</p>
        </div>

        {/* TAGLIA */}
        <div className="mb-4">
          <h2 className="text-slate-400 text-sm">Taglia</h2>
          <p>{data.taglia}</p>
        </div>

        {/* LOCATION */}
        <div className="mb-4">
          <h2 className="text-slate-400 text-sm">Punto di ritiro</h2>
          <p>{data.location}</p>
        </div>

        {/* ACCESSORI */}
        <div className="mb-4">
          <h2 className="text-slate-400 text-sm">Accessori</h2>
          <ul className="list-disc ml-5">
            {data.accessori.map((a: string, i: number) => (
              <li key={i}>{a}</li>
            ))}
          </ul>
        </div>

        {/* ASSICURAZIONE */}
        <div className="mb-4">
          <h2 className="text-slate-400 text-sm">Assicurazione</h2>
          <p>{data.assicurazione}</p>
        </div>

        {/* PREZZO */}
        <div className="mt-6 p-4 bg-slate-800 rounded-lg">
          <h2 className="text-slate-400 text-sm">Totale</h2>
          <p className="text-2xl font-bold text-emerald-400">
            € {data.prezzo}
          </p>
        </div>

        {/* AZIONI */}
        <div className="flex gap-3 mt-6">
          <button
            onClick={() => router.back()}
            className="w-1/2 bg-slate-700 hover:bg-slate-600 p-3 rounded-lg"
          >
            Indietro
          </button>

          <button
            onClick={() => alert("Prenotazione confermata (mock)")}
            className="w-1/2 bg-emerald-500 text-black font-bold p-3 rounded-lg"
          >
            Conferma
          </button>
        </div>
      </div>
    </div>
  );
}