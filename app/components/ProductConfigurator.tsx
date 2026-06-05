"use client";

import { useState, useEffect } from "react";
import { BiciclettaCatalog } from "@/lib/zodSchemas/bicicletta";
import { BiciclettaLocationWithDetails } from "@/lib/zodSchemas/biciclettaLocation";
import { bicicletteApi } from "@/lib/axios/bicicletta";
import { useRouter } from "next/navigation";

interface Accessorio {
  id: number;
  nome: string;
  prezzo?: string;
}

interface ConfiguratorProps {
  product: BiciclettaCatalog;
  onClose: () => void;
}

export default function ProductConfigurator({ product, onClose }: ConfiguratorProps) {
  const router = useRouter();

  const [stockData, setStockData] = useState<BiciclettaLocationWithDetails[]>([]);
  const [loadingStock, setLoadingStock] = useState(true);

  const [selectedSize, setSelectedSize] = useState<string>("");
  const [selectedLocationStock, setSelectedLocationStock] = useState<BiciclettaLocationWithDetails | null>(null);
  const [selectedTipo, setSelectedTipo] = useState<"E" | "M" | "">("");

  const [accessori, setAccessori] = useState<Accessorio[]>([]);
  const [loadingAccessori, setLoadingAccessori] = useState(true);
  const [selectedAccessori, setSelectedAccessori] = useState<number[]>([]);

  useEffect(() => {
    bicicletteApi
      .getLocations(product.id)
      .then(setStockData)
      .catch(console.error)
      .finally(() => setLoadingStock(false));
  }, [product.id]);

  useEffect(() => {
    fetch("/api/accessori")
      .then((r) => r.json())
      .then(setAccessori)
      .catch(console.error)
      .finally(() => setLoadingAccessori(false));
  }, []);

  // Reset a cascata quando cambia la selezione
  const handleSizeSelect = (size: string) => {
    setSelectedSize(size);
    setSelectedLocationStock(null);
    setSelectedTipo("");
  };

  const handleLocationSelect = (stock: BiciclettaLocationWithDetails) => {
    setSelectedLocationStock(stock);
    setSelectedTipo("");
  };

  // Taglie uniche disponibili nello stock
  const taglieDisponibili = [...new Map(
    stockData
      .filter(s => s.numberE > 0 || s.numberM > 0)
      .map(s => [s.biciclettaSpecific.size, s.biciclettaSpecific])
  ).values()]

  // Location disponibili per la taglia selezionata
  const locationPerTaglia = stockData.filter(
    s => s.biciclettaSpecific.size === selectedSize && (s.numberE > 0 || s.numberM > 0)
  )

  const canSubmit = selectedSize && selectedLocationStock && selectedTipo

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="absolute inset-0" onClick={onClose} />

      <div className="relative bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl p-6 z-10 text-left overflow-y-auto max-h-[90vh]">
        {/* Header */}
        <div className="flex justify-between items-center border-b border-slate-800 pb-3 mb-4">
          <div>
            <span className="text-xs text-emerald-400 font-bold uppercase tracking-wider">
              Configurazione
            </span>
            <h3 className="text-xl font-extrabold text-white">{product.type}</h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 w-8 h-8 rounded-full flex items-center justify-center transition"
          >
            ✕
          </button>
        </div>

        <form
          onSubmit={(e) => { e.preventDefault(); router.push("/checkout"); }}
          className="flex flex-col gap-5 text-sm"
        >
          {/* 1. Taglia */}
          <div>
            <label className="block text-slate-300 font-semibold mb-2">
              1. Scegli la taglia:
            </label>
            {loadingStock ? (
              <p className="text-slate-500 text-xs">Caricamento disponibilità...</p>
            ) : taglieDisponibili.length === 0 ? (
              <p className="text-red-400 text-xs">Nessuna taglia disponibile.</p>
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
                      €{spec.price.toFixed(2)}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* 2. Location — appare dopo aver scelto la taglia */}
          {selectedSize && (
            <div>
              <label className="block text-slate-300 font-semibold mb-2">
                2. Dove vuoi ritirarla?
              </label>
              <div className="flex flex-col gap-2">
                {locationPerTaglia.map((stock) => (
                  <button
                    key={stock.id}
                    type="button"
                    onClick={() => handleLocationSelect(stock)}
                    className={`w-full text-left p-3 rounded-lg border transition ${
                      selectedLocationStock?.id === stock.id
                        ? "border-emerald-400 bg-emerald-400/10 text-white"
                        : "border-slate-700 bg-slate-800 text-slate-300 hover:border-slate-500"
                    }`}
                  >
                    <span className="font-semibold">{stock.location.nome}</span>
                    <span className="block text-xs text-slate-400 mt-0.5">
                      {stock.location.indirizzo}
                    </span>
                    <div className="flex gap-3 mt-1.5 text-xs">
                      {stock.numberE > 0 && (
                        <span className="text-cyan-400">⚡ {stock.numberE} elettriche</span>
                      )}
                      {stock.numberM > 0 && (
                        <span className="text-emerald-400">🚲 {stock.numberM} muscolari</span>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* 3. Tipo E/M — appare dopo aver scelto la location */}
          {selectedLocationStock && (
            <div>
              <label className="block text-slate-300 font-semibold mb-2">
                3. Tipo di propulsione:
              </label>
              <div className="flex gap-2">
                {selectedLocationStock.numberE > 0 && (
                  <button
                    type="button"
                    onClick={() => setSelectedTipo("E")}
                    className={`flex-1 py-2.5 rounded-lg border font-semibold transition ${
                      selectedTipo === "E"
                        ? "border-cyan-400 bg-cyan-400/10 text-cyan-400"
                        : "border-slate-700 bg-slate-800 text-slate-300 hover:border-slate-500"
                    }`}
                  >
                    ⚡ Elettrica
                  </button>
                )}
                {selectedLocationStock.numberM > 0 && (
                  <button
                    type="button"
                    onClick={() => setSelectedTipo("M")}
                    className={`flex-1 py-2.5 rounded-lg border font-semibold transition ${
                      selectedTipo === "M"
                        ? "border-emerald-400 bg-emerald-400/10 text-emerald-400"
                        : "border-slate-700 bg-slate-800 text-slate-300 hover:border-slate-500"
                    }`}
                  >
                    🚲 Muscolare
                  </button>
                )}
              </div>
            </div>
          )}

          {/* 4. Accessori — appare dopo aver scelto il tipo */}
          {selectedTipo && (
            <div>
              <label className="block text-slate-300 font-semibold mb-2">
                4. Accessori Extra:
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
                        {acc.prezzo && (
                          <span className="text-xs text-slate-500"> ({acc.prezzo})</span>
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
            disabled={!canSubmit}
            className="w-full bg-gradient-to-r from-emerald-400 to-cyan-500 text-slate-900 font-bold py-3 rounded-lg mt-2 hover:opacity-90 active:scale-[0.99] transition shadow-lg shadow-emerald-500/10 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Conferma e Prenota
          </button>
        </form>
      </div>
    </div>
  );
}