"use client";

import { useState, useEffect } from "react";
import { BiciclettaCatalog, Alimentazione } from "@/lib/zodSchemas/bicicletta";
import { BiciclettaLocationWithDetails } from "@/lib/zodSchemas/biciclettaLocation";
import { DisponibilitaResult, bicicletteApi } from "@/lib/axios/bicicletta";
import { useRouter } from "next/navigation";

interface Accessorio {
  id: number;
  nome: string;
  prezzo?: number;
}

interface ConfiguratorProps {
  product: BiciclettaCatalog;
  onClose: () => void;
}

export default function ProductConfigurator({ product, onClose }: ConfiguratorProps) {
  const router = useRouter();

  const [dataRitiro, setDataRitiro] = useState("");
  const [oraRitiro, setOraRitiro] = useState("10:00");
  const [dataConsegna, setDataConsegna] = useState("");
  const [oraConsegna, setOraConsegna] = useState("10:00");

  const [disponibilita, setDisponibilita] = useState<DisponibilitaResult[]>([]);
  const [loadingDisp, setLoadingDisp] = useState(false);

  const [selectedSize, setSelectedSize] = useState<string>("");
  const [selectedAlimentazione, setSelectedAlimentazione] = useState<Alimentazione | "">("");
  const [selectedLocationStock, setSelectedLocationStock] = useState<BiciclettaLocationWithDetails | null>(null);

  const [accessori, setAccessori] = useState<Accessorio[]>([]);
  const [loadingAccessori, setLoadingAccessori] = useState(true);
  const [selectedAccessori, setSelectedAccessori] = useState<number[]>([]);

  useEffect(() => {
    fetch("/api/accessori")
      .then((r) => r.json())
      .then(setAccessori)
      .catch(console.error)
      .finally(() => setLoadingAccessori(false));
  }, []);

  // Carica disponibilità in base alle date selezionate
  useEffect(() => {
    if (!dataRitiro || !dataConsegna) {
      setDisponibilita([]);
      return;
    }
    setLoadingDisp(true);
    setSelectedSize("");
    setSelectedAlimentazione("");
    setSelectedLocationStock(null);
    bicicletteApi
      .getDisponibilita({
        dataRitiro,
        oraRitiro,
        dataConsegna,
        oraConsegna,
        biciclettaId: product.id,
      })
      .then(setDisponibilita)
      .catch(console.error)
      .finally(() => setLoadingDisp(false));
  }, [dataRitiro, oraRitiro, dataConsegna, oraConsegna, product.id]);

  const handleSizeSelect = (size: string) => {
    setSelectedSize(size);
    setSelectedAlimentazione("");
    setSelectedLocationStock(null);
  };

  const handleAlimentazioneSelect = (alim: Alimentazione) => {
    setSelectedAlimentazione(alim);
    setSelectedLocationStock(null);
  };

  const handleLocationSelect = (disp: DisponibilitaResult) => {
    setSelectedLocationStock(disp as unknown as BiciclettaLocationWithDetails);
  };

  const hasDates = dataRitiro && dataConsegna;

  const taglieDisponibili = disponibilita.length > 0
    ? [...new Map(
        disponibilita
          .filter(s => s.istanzeDisponibili > 0)
          .map(s => [s.biciclettaSpecific.size, s.biciclettaSpecific])
      ).values()]
    : [];

  const alimentazioniPerTaglia = selectedSize
    ? [...new Set(
        disponibilita
          .filter(s => s.biciclettaSpecific.size === selectedSize && s.istanzeDisponibili > 0)
          .map(s => s.biciclettaSpecific.alimentazione)
      )]
    : [];

  const locationPerTaglia = selectedAlimentazione
    ? disponibilita.filter(
        s => s.biciclettaSpecific.size === selectedSize
          && s.biciclettaSpecific.alimentazione === selectedAlimentazione
          && s.istanzeDisponibili > 0
      )
    : [];

  const selectedSpecifica = selectedSize && selectedAlimentazione
    ? disponibilita.find(
        s => s.biciclettaSpecific.size === selectedSize
          && s.biciclettaSpecific.alimentazione === selectedAlimentazione
      )?.biciclettaSpecific
    : null;

  const canSubmit = selectedSize && selectedAlimentazione && selectedLocationStock;

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

  function sendPrenotazione() {
    if (!selectedSpecifica || !selectedLocationStock) return;

    const config = {
      dateRange: { dataRitiro, oraRitiro, dataConsegna, oraConsegna },
      prodotto: { id: product.id, nome: product.nome, tipologia: product.tipologia },
      biciclettaSpecificId: selectedSpecifica.id,
      biciclettaSpecific: {
        size: selectedSpecifica.size,
        alimentazione: selectedSpecifica.alimentazione,
        prezzoGiornata: selectedSpecifica.prezzoGiornata,
        prezzoMezzaGiornata: selectedSpecifica.prezzoMezzaGiornata,
      },
      locationId: selectedLocationStock.locationId,
      location: { nome: selectedLocationStock.location.nome, indirizzo: selectedLocationStock.location.indirizzo },
      alimentazione: selectedAlimentazione,
      accessoriIds: selectedAccessori,
      accessori: accessori.filter(a => selectedAccessori.includes(a.id)),
    };
    localStorage.setItem("prenotazioneConfig", JSON.stringify(config));
    router.push("/checkout");
  }

  const tipologiaLabel: Record<string, string> = {
    CITY: "City Bike",
    MOUNTAIN: "Mountain Bike",
    GRAVEL: "Gravel",
    ROAD: "Road Bike",
  };

  const fasceOrarie = Array.from({ length: 10 }, (_, i) => {
    const h = i + 9;
    return `${h.toString().padStart(2, "0")}:00`;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="absolute inset-0" onClick={onClose} />

      <div className="relative bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl p-6 z-10 text-left overflow-y-auto max-h-[90vh]">
        <div className="flex justify-between items-center border-b border-slate-800 pb-3 mb-4">
          <div>
            <span className="text-xs text-emerald-400 font-bold uppercase tracking-wider">
              Configurazione
            </span>
            <h3 className="text-xl font-extrabold text-white">{product.nome}</h3>
            <p className="text-xs text-slate-400">{tipologiaLabel[product.tipologia] ?? product.tipologia}</p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 w-8 h-8 rounded-full flex items-center justify-center transition"
          >
            ✕
          </button>
        </div>

        <form
          onSubmit={(e) => { e.preventDefault(); sendPrenotazione(); }}
          className="flex flex-col gap-5 text-sm"
        >
          {/* 0. Date / Time */}
          <div>
            <label className="block text-slate-300 font-semibold mb-2">
              1. Scegli data e ora:
            </label>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-slate-400 mb-1">Ritiro</label>
                <input
                  type="date"
                  value={dataRitiro}
                  onChange={e => { setDataRitiro(e.target.value); setSelectedSize(""); }}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white text-xs"
                />
                <select
                  value={oraRitiro}
                  onChange={e => { setOraRitiro(e.target.value); setSelectedSize(""); }}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white text-xs mt-1"
                >
                  {fasceOrarie.map(h => (
                    <option key={h} value={h}>{h}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Riconsegna</label>
                <input
                  type="date"
                  value={dataConsegna}
                  onChange={e => { setDataConsegna(e.target.value); setSelectedSize(""); }}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white text-xs"
                />
                <select
                  value={oraConsegna}
                  onChange={e => { setOraConsegna(e.target.value); setSelectedSize(""); }}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white text-xs mt-1"
                >
                  {fasceOrarie.map(h => (
                    <option key={h} value={h}>{h}</option>
                  ))}
                </select>
              </div>
            </div>
            {erroreData && (
              <p className="text-red-400 text-xs mt-1">{erroreData}</p>
            )}
          </div>

          {/* 1. Taglia (solo dopo aver selezionato le date) */}
          {hasDates && !erroreData && (
            <div>
              <label className="block text-slate-300 font-semibold mb-2">
                2. Scegli la taglia:
              </label>
              {loadingDisp ? (
                <p className="text-slate-500 text-xs">Caricamento disponibilità...</p>
              ) : taglieDisponibili.length === 0 ? (
                <p className="text-red-400 text-xs">Nessuna taglia disponibile per le date selezionate.</p>
              ) : (
                <div className="flex gap-2">
                  {taglieDisponibili.map((spec) => (
                    <button
                      key={spec.id}
                      type="button"
                      onClick={() => handleSizeSelect(spec.size)}
                      className={`flex-1 py-3 rounded-lg border font-semibold transition ${
                        selectedSize === spec.size
                          ? "border-emerald-400 bg-emerald-400/10 text-white"
                          : "border-slate-700 bg-slate-800 text-slate-300 hover:border-slate-500"
                      }`}
                    >
                      {spec.size}
                      <span className="block text-xs font-normal text-slate-400 mt-0.5">
                        da €{Number(spec.prezzoGiornata).toFixed(2)}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* 2. Alimentazione */}
          {selectedSize && (
            <div>
              <label className="block text-slate-300 font-semibold mb-2">
                3. Tipo di propulsione:
              </label>
              <div className="flex gap-2">
                {alimentazioniPerTaglia.includes("ELETTRICA") && (
                  <button
                    type="button"
                    onClick={() => handleAlimentazioneSelect("ELETTRICA")}
                    className={`flex-1 py-2.5 rounded-lg border font-semibold transition ${
                      selectedAlimentazione === "ELETTRICA"
                        ? "border-cyan-400 bg-cyan-400/10 text-cyan-400"
                        : "border-slate-700 bg-slate-800 text-slate-300 hover:border-slate-500"
                    }`}
                  >
                    ⚡ Elettrica
                  </button>
                )}
                {alimentazioniPerTaglia.includes("MUSCOLARE") && (
                  <button
                    type="button"
                    onClick={() => handleAlimentazioneSelect("MUSCOLARE")}
                    className={`flex-1 py-2.5 rounded-lg border font-semibold transition ${
                      selectedAlimentazione === "MUSCOLARE"
                        ? "border-emerald-400 bg-emerald-400/10 text-emerald-400"
                        : "border-slate-700 bg-slate-800 text-slate-300 hover:border-slate-500"
                    }`}
                  >
                    🚲 Muscolare
                  </button>
                )}
                {alimentazioniPerTaglia.length === 0 && (
                  <p className="text-slate-500 text-xs py-2">Nessuna opzione disponibile per questa taglia.</p>
                )}
              </div>
            </div>
          )}

          {/* 3. Location */}
          {selectedAlimentazione && (
            <div>
              <label className="block text-slate-300 font-semibold mb-2">
                4. Dove vuoi ritirarla?
              </label>
              <div className="flex flex-col gap-2">
                {locationPerTaglia.length === 0 ? (
                  <p className="text-slate-500 text-xs py-2">Nessuna disponibilità per le date selezionate.</p>
                ) : (
                  locationPerTaglia.map((disp) => (
                    <button
                      key={disp.id}
                      type="button"
                      onClick={() => handleLocationSelect(disp)}
                      className={`w-full text-left p-3 rounded-lg border transition ${
                        selectedLocationStock?.id === disp.id
                          ? "border-emerald-400 bg-emerald-400/10 text-white"
                          : "border-slate-700 bg-slate-800 text-slate-300 hover:border-slate-500"
                      }`}
                    >
                      <span className="font-semibold">{disp.location.nome}</span>
                      <span className="block text-xs text-slate-400 mt-0.5">
                        {disp.location.indirizzo}
                      </span>
                      <span className="inline-block mt-1.5 text-xs text-emerald-400 font-semibold">
                        {disp.istanzeDisponibili} disponibile{disp.istanzeDisponibili !== 1 ? "i" : ""}
                      </span>
                    </button>
                  ))
                )}
              </div>
            </div>
          )}

          {/* 4. Accessori */}
          {selectedLocationStock && (
            <div>
              <label className="block text-slate-300 font-semibold mb-2">
                5. Accessori Extra:
              </label>
              <div className="flex flex-col gap-2 bg-slate-800/40 p-3 rounded-lg border border-slate-800">
                {loadingAccessori ? (
                  <p className="text-slate-500 text-xs py-1">Caricamento accessori...</p>
                ) : accessori.length === 0 ? (
                  <p className="text-slate-500 text-xs py-1">Nessun accessorio disponibile.</p>
                ) : (
                  accessori.map((acc) => (
                    <label
                      key={acc.id}
                      className="flex items-center gap-3 text-slate-300 cursor-pointer py-1 hover:text-white"
                    >
                      <input
                        type="checkbox"
                        checked={selectedAccessori.includes(acc.id)}
                        onChange={() =>
                          setSelectedAccessori((prev) =>
                            prev.includes(acc.id)
                              ? prev.filter((i) => i !== acc.id)
                              : [...prev, acc.id]
                          )
                        }
                        className="w-4 h-4 accent-emerald-400 rounded"
                      />
                      <span>
                        {acc.nome}
                        {acc.prezzo !== undefined && (
                          <span className="text-xs text-slate-500"> (€{acc.prezzo.toFixed(2)})</span>
                        )}
                      </span>
                    </label>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={!canSubmit || !!erroreData}
            className="w-full bg-gradient-to-r from-emerald-400 to-cyan-500 text-slate-900 font-bold py-3 rounded-lg mt-2 hover:opacity-90 active:scale-[0.99] transition shadow-lg shadow-emerald-500/10 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Conferma e Prenota
          </button>
        </form>
      </div>
    </div>
  );
}
